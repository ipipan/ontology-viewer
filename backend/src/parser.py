import os
import glob
from rdflib import Graph, URIRef, RDF, RDFS, OWL, SKOS
from typing import List, Dict, Optional, Set, Any
from pathlib import Path
from .models import Example, Corpus, OntologyClass, Argument, Connective

class OntologyParser:
    def __init__(self, data_dir: str = "data"):
        self.data_dir = data_dir
        self.graph: Graph = Graph()
        self.examples: List[Example] = []
        self.corpora: Dict[str, Corpus] = {}
        self.ontology_classes: Dict[str, OntologyClass] = {}
        self._example_type_classes: Set[URIRef] = set()

        # Namespaces
        self.ISO_NS: str = "http://purl.org/olia/discourse/discourse.ISO.UDisc.owl#"
        self.SYMMETRIC_DREL: URIRef = URIRef(self.ISO_NS + "SymmetricDRel")
        self.ASYMMETRIC_DREL: URIRef = URIRef(self.ISO_NS + "AsymmetricDRel")
        self.DREL: URIRef = URIRef(self.ISO_NS + "DRel")

    def load_ontology_files(self):
        """Load all OWL files from the data directory"""
        print(f"Looking for OWL files in: {self.data_dir}")

        # Track which file each individual comes from
        self.individual_to_file = {}

        # Load main ontology file
        main_ontology = os.path.join(self.data_dir, "discourse.ISO.UDisc.owl")
        print(f"Checking for main ontology: {main_ontology}")
        if os.path.exists(main_ontology):
            print(f"Found main ontology, parsing...")
            self.graph.parse(main_ontology, format="xml")
            print(f"Loaded main ontology: {main_ontology}")
        else:
            print(f"Main ontology not found at: {main_ontology}")

        # Load corpus files
        corpus_pattern = os.path.join(self.data_dir, "*-*.owl")
        print(f"Looking for corpus files with pattern: {corpus_pattern}")
        corpus_files = glob.glob(corpus_pattern)
        print(f"Found {len(corpus_files)} corpus files: {corpus_files}")

        for corpus_file in corpus_files:
            try:
                print(f"Parsing corpus file: {corpus_file}")
                # Create a temporary graph to track individuals from this file
                temp_graph = Graph()
                temp_graph.parse(corpus_file, format="xml")

                # Track individuals from this file
                for individual in temp_graph.subjects(RDF.type, None):
                    if isinstance(individual, URIRef):
                        self.individual_to_file[str(individual)] = corpus_file

                # Add to main graph
                self.graph.parse(corpus_file, format="xml")
                print(f"Loaded corpus file: {corpus_file}")

                # Extract corpus info from filename
                filename = Path(corpus_file).stem
                if '-' in filename:
                    corpus_name, language = filename.rsplit('-', 1)
                    self.corpora[corpus_name] = Corpus(
                        name=corpus_name,
                        language=language,
                        file=corpus_file,
                        count=0  # Will be updated after parsing examples
                    )
                    print(f"Added corpus: {corpus_name} (language: {language})")
            except Exception as e:
                print(f"Error loading {corpus_file}: {e}")

        # Build the set of example type classes after all files are loaded
        self._build_example_type_classes()

    def _build_example_type_classes(self) -> None:
        """Build the set of OWL classes that are direct subclasses of AsymmetricDRel or SymmetricDRel.

        NamedIndividuals whose rdf:type is one of these classes are considered examples.
        """
        self._example_type_classes = set()
        root_classes: List[URIRef] = [self.ASYMMETRIC_DREL, self.SYMMETRIC_DREL]
        for root in root_classes:
            for child in self.graph.subjects(RDFS.subClassOf, root):
                if isinstance(child, URIRef):
                    self._example_type_classes.add(child)
        print(f"Detected {len(self._example_type_classes)} example type classes: "
              f"{[str(c).split('#')[-1] for c in self._example_type_classes]}")

    def _is_example_individual(self, types: List[Any]) -> bool:
        """Check if a NamedIndividual is an example by verifying that at least one
        of its rdf:type values is a direct subclass of AsymmetricDRel or SymmetricDRel.
        """
        for t in types:
            if isinstance(t, URIRef) and t in self._example_type_classes:
                return True
        return False

    def extract_examples(self) -> None:
        """Extract examples from the loaded ontology graph"""
        self.examples = []
        seen_individuals: Set[str] = set()  # Track processed individuals to avoid duplicates

        # Counters for progress logging
        total_subjects: int = 0
        duplicate_count: int = 0
        non_named_individual_count: int = 0
        non_example_count: int = 0
        no_relevant_types_count: int = 0
        creation_failed_count: int = 0

        print("Starting example extraction from ontology graph...")

        # Find all NamedIndividuals that are examples
        for individual in self.graph.subjects(RDF.type, None):
            if isinstance(individual, URIRef):
                total_subjects += 1

                # Skip if we've already processed this individual
                individual_str = str(individual)
                if individual_str in seen_individuals:
                    duplicate_count += 1
                    continue
                seen_individuals.add(individual_str)

                # Get all types of this individual
                types: List[Any] = list(self.graph.objects(individual, RDF.type))

                # Check if this is a NamedIndividual
                is_named_individual: bool = any(
                    str(t) == 'http://www.w3.org/2002/07/owl#NamedIndividual' for t in types
                )
                if not is_named_individual:
                    non_named_individual_count += 1
                    continue

                # Check if this individual is an example (typed with a direct subclass
                # of AsymmetricDRel or SymmetricDRel)
                if not self._is_example_individual(types):
                    non_example_count += 1
                    continue

                # Get all relevant types (types in the ISO namespace)
                relevant_types = []
                for t in types:
                    if str(t).startswith(self.ISO_NS):
                        relevant_types.append(t)

                if not relevant_types:
                    no_relevant_types_count += 1
                    print(f"  Skipped individual with no ISO-namespace types: {individual_str}")
                    continue

                example = self._create_example(individual, types, relevant_types)
                if example:
                    self.examples.append(example)
                    if len(self.examples) % 1000 == 0:
                        print(f"  ... loaded {len(self.examples)} examples so far "
                              f"(scanned {total_subjects} subjects)")
                else:
                    creation_failed_count += 1
                    short_id: str = individual_str.split('#')[-1] if '#' in individual_str else individual_str
                    print(f"  Skipped (creation failed): {short_id}")

        # Summary of extraction filtering
        print(f"\nExample extraction summary:")
        print(f"  Total URI subjects scanned: {total_subjects}")
        print(f"  Duplicates skipped: {duplicate_count}")
        print(f"  Non-NamedIndividual skipped: {non_named_individual_count}")
        print(f"  Non-example individuals skipped: {non_example_count}")
        print(f"  No relevant ISO types skipped: {no_relevant_types_count}")
        print(f"  Creation failed skipped: {creation_failed_count}")
        print(f"  Examples successfully loaded: {len(self.examples)}")

        # Update corpus counts and log per-corpus breakdown
        corpus_counts: Dict[str, int] = {}
        for corpus_name in self.corpora:
            count = sum(1 for ex in self.examples if ex.corpus == corpus_name)
            self.corpora[corpus_name].count = count
            if count > 0:
                corpus_counts[corpus_name] = count

        if corpus_counts:
            print(f"\nExamples per corpus:")
            for name, count in sorted(corpus_counts.items(), key=lambda x: x[1], reverse=True):
                print(f"  {name}: {count}")

    def _create_example(self, individual: URIRef, all_types: List[URIRef], relevant_types: List[URIRef]) -> Optional[Example]:
        """Create an Example object from an individual"""
        # Get corpus from provenance (filename)
        provenance = self._get_provenance(individual)
        if not provenance:
            return None

        corpus_name = self._extract_corpus_from_provenance(provenance)
        if not corpus_name:
            return None

        # Get text from rdfs:label
        text = self._get_label(individual)
        if not text:
            return None

        # Get skos:notation
        notation = self._get_notation(individual)

        # Get relation type (first relevant type that's not a connective)
        relation_type = self._get_relation_type(relevant_types)

        # Determine symmetric property
        symmetric = self._determine_symmetry(relevant_types)

        # Get language from corpus
        language = self.corpora[corpus_name].language if corpus_name in self.corpora else "unknown"

        # Extract arguments and connective
        arg1_list, arg2_list, connective_list = self._extract_arguments_and_connective(individual)

        return Example(
            id=str(individual),
            text=text,
            language=language,
            relation=relation_type,
            symmetric=symmetric,
            corpus=corpus_name,
            ontology_types=[str(t) for t in relevant_types],
            provenance=provenance,
            notation=notation,
            arg1=arg1_list,
            arg2=arg2_list,
            connective=connective_list
        )

    def _get_label(self, individual: URIRef) -> str:
        """Get the label for an individual (rdfs:label or skos:prefLabel)"""
        # Try rdfs:label first
        for label in self.graph.objects(individual, RDFS.label):
            if label and str(label).strip():
                return str(label).strip()

        # Try skos:prefLabel
        for label in self.graph.objects(individual, SKOS.prefLabel):
            if label and str(label).strip():
                return str(label).strip()

        return ""

    def _get_notation(self, individual: URIRef) -> Optional[str]:
        """Get skos:notation if present"""
        for notation in self.graph.objects(individual, SKOS.notation):
            if notation and str(notation).strip():
                return str(notation).strip()
        return None

    def _extract_arguments_and_connective(self, individual: URIRef) -> tuple[List[Argument], List[Argument], List[Connective]]:
        """Extract arg1, arg2, and connective lists from an example individual, ordered by skos:order"""
        arg1_parts: List[tuple[Argument, int]] = []
        arg2_parts: List[tuple[Argument, int]] = []
        connective_parts: List[tuple[Connective, int]] = []

        # Get all object properties from the individual
        for prop, obj in self.graph.predicate_objects(individual):
            if not isinstance(obj, URIRef):
                continue

            # Get the object's label and types
            obj_label = self._get_label(obj)
            obj_types = list(self.graph.objects(obj, RDF.type))
            obj_order = self._get_skos_order(obj)

            if not obj_label:
                continue

            # Classify and collect into the appropriate list
            if self._is_arg1_type(obj_types):
                arg1_parts.append((
                    Argument(
                        id=str(obj),
                        text=obj_label,
                        type=self._get_primary_type(obj_types),
                        order=obj_order
                    ),
                    obj_order or 999
                ))
            elif self._is_arg2_type(obj_types):
                arg2_parts.append((
                    Argument(
                        id=str(obj),
                        text=obj_label,
                        type=self._get_primary_type(obj_types),
                        order=obj_order
                    ),
                    obj_order or 999
                ))
            elif self._is_connective_type(obj_types):
                connective_parts.append((
                    Connective(
                        id=str(obj),
                        text=obj_label,
                        order=obj_order
                    ),
                    obj_order or 999
                ))

        # Sort each list by skos:order
        arg1_parts.sort(key=lambda x: x[1])
        arg2_parts.sort(key=lambda x: x[1])
        connective_parts.sort(key=lambda x: x[1])

        return (
            [item for item, _ in arg1_parts],
            [item for item, _ in arg2_parts],
            [item for item, _ in connective_parts]
        )

    def _get_skos_order(self, individual: URIRef) -> Optional[int]:
        """Get skos:order if present (custom property)"""
        # Create the skos:order URI manually since it's not in the standard SKOS namespace
        skos_order = URIRef("http://www.w3.org/2004/02/skos/core#order")
        for order in self.graph.objects(individual, skos_order):
            try:
                return int(str(order))
            except (ValueError, TypeError):
                continue
        return None

    def _is_arg1_type(self, types: List[URIRef]) -> bool:
        """Check if the types indicate this is an Arg1"""
        for t in types:
            type_str = str(t)
            if type_str.startswith(self.ISO_NS):
                class_name = type_str[len(self.ISO_NS):]
                # Check if it's a subclass of Arg1
                if self._is_ancestor(t, URIRef(self.ISO_NS + "Arg1")):
                    return True
        return False

    def _is_arg2_type(self, types: List[URIRef]) -> bool:
        """Check if the types indicate this is an Arg2"""
        for t in types:
            type_str = str(t)
            if type_str.startswith(self.ISO_NS):
                class_name = type_str[len(self.ISO_NS):]
                # Check if it's a subclass of Arg2
                if self._is_ancestor(t, URIRef(self.ISO_NS + "Arg2")):
                    return True
        return False

    def _is_connective_type(self, types: List[URIRef]) -> bool:
        """Check if the types indicate this is a Connective"""
        for t in types:
            type_str = str(t)
            if type_str.startswith(self.ISO_NS):
                class_name = type_str[len(self.ISO_NS):]
                if class_name == "Connective" or self._is_ancestor(t, URIRef(self.ISO_NS + "Connective")):
                    return True
        return False

    def _get_primary_type(self, types: List[URIRef]) -> str:
        """Get the primary type name from a list of types"""
        for t in types:
            type_str = str(t)
            if type_str.startswith(self.ISO_NS):
                class_name = type_str[len(self.ISO_NS):]
                if class_name and class_name not in ["Arg1", "Arg2", "Connective"]:
                    return class_name
        return "Argument"

    def _get_relation_type(self, types: List[URIRef]) -> str:
        """Get the main relation type from the list of types"""
        for t in types:
            type_str = str(t)
            if type_str.startswith(self.ISO_NS):
                # Remove namespace to get just the class name
                class_name = type_str[len(self.ISO_NS):]
                if class_name and class_name not in ["Connective", "SymmetricDRel", "AsymmetricDRel", "DRel"]:
                    return class_name
        return "Unknown"

    def _determine_symmetry(self, types: List[URIRef]) -> Optional[bool]:
        """Determine if the relation is symmetric by checking ancestry"""
        for t in types:
            if self._is_ancestor(t, self.SYMMETRIC_DREL):
                return True
            elif self._is_ancestor(t, self.ASYMMETRIC_DREL):
                return False
        return None

    def _is_ancestor(self, child: URIRef, ancestor: URIRef) -> bool:
        """Check if a class is an ancestor of another class"""
        if child == ancestor:
            return True

        # Check direct subClassOf relationships
        for parent in self.graph.objects(child, RDFS.subClassOf):
            if parent == ancestor:
                return True
            # Recursively check parents
            if self._is_ancestor(parent, ancestor):
                return True

        return False

    def _get_provenance(self, individual: URIRef) -> Optional[str]:
        """Get the provenance (filename) for an individual"""
        individual_str = str(individual)
        return self.individual_to_file.get(individual_str, "unknown")

    def _extract_corpus_from_provenance(self, provenance: str) -> Optional[str]:
        """Extract corpus name from provenance filename"""
        filename = Path(provenance).stem
        if '-' in filename:
            return filename.rsplit('-', 1)[0]
        return None

    def extract_ontology_classes(self):
        """Extract ontology class hierarchy"""
        self.ontology_classes = {}

        # Find all classes in the ISO namespace
        for cls in self.graph.subjects(RDF.type, OWL.Class):
            if isinstance(cls, URIRef) and str(cls).startswith(self.ISO_NS):
                label = self._get_label(cls) or cls.split('#')[-1]

                # Get parent classes
                parent_uris = []
                for parent in self.graph.objects(cls, RDFS.subClassOf):
                    if isinstance(parent, URIRef):
                        parent_uris.append(str(parent))

                # Determine symmetry
                symmetric = None
                if self._is_ancestor(cls, self.SYMMETRIC_DREL):
                    symmetric = True
                elif self._is_ancestor(cls, self.ASYMMETRIC_DREL):
                    symmetric = False

                self.ontology_classes[str(cls)] = OntologyClass(
                    label=label,
                    uri=str(cls),
                    parent_uris=parent_uris,
                    symmetric=symmetric
                )

    def get_all_examples(self) -> List[Example]:
        """Get all parsed examples"""
        return self.examples

    def get_corpora(self) -> List[Corpus]:
        """Get all parsed corpora"""
        return list(self.corpora.values())

    def get_ontology_classes(self) -> List[OntologyClass]:
        """Get all ontology classes"""
        return list(self.ontology_classes.values())

    def get_connectives(self) -> List[Dict[str, Any]]:
        """Get all unique connectives with their occurrence counts"""
        connective_counts: Dict[str, int] = {}

        # Count occurrences of each connective across all examples
        for example in self.examples:
            for conn in example.connective:
                text = conn.text.strip()
                if text:
                    connective_counts[text] = connective_counts.get(text, 0) + 1

        # Convert to list of dicts sorted by count (descending)
        connectives = [
            {"label": label, "count": count}
            for label, count in connective_counts.items()
        ]
        connectives.sort(key=lambda x: x["count"], reverse=True)

        return connectives