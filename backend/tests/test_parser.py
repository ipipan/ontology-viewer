import pytest
import os
from pathlib import Path
from src.parser import OntologyParser

def test_ontology_parser_initialization():
    """Test that OntologyParser can be initialized"""
    parser = OntologyParser(data_dir="../data")
    assert parser is not None
    assert parser.data_dir == "../data"

def test_load_ontology_files():
    """Test loading ontology files"""
    parser = OntologyParser(data_dir="../data")
    parser.load_ontology_files()
    
    # Should have loaded at least the main ontology and one corpus
    assert len(parser.corpora) >= 1
    assert "PDC" in parser.corpora

def test_extract_examples():
    """Test extracting examples from ontology"""
    parser = OntologyParser(data_dir="../data")
    parser.load_ontology_files()
    parser.extract_examples()
    
    # Should have extracted some examples
    assert len(parser.examples) > 0
    
    # Check example structure
    example = parser.examples[0]
    assert hasattr(example, 'id')
    assert hasattr(example, 'text')
    assert hasattr(example, 'language')
    assert hasattr(example, 'corpus')
    assert hasattr(example, 'relation')

def test_extract_ontology_classes():
    """Test extracting ontology classes"""
    parser = OntologyParser(data_dir="../data")
    parser.load_ontology_files()
    parser.extract_ontology_classes()
    
    # Should have extracted some ontology classes
    assert len(parser.ontology_classes) > 0
    
    # Check class structure
    class_uri = list(parser.ontology_classes.keys())[0]
    ontology_class = parser.ontology_classes[class_uri]
    assert hasattr(ontology_class, 'label')
    assert hasattr(ontology_class, 'uri')
    assert hasattr(ontology_class, 'parent_uris')

def test_get_corpora():
    """Test getting corpora list"""
    parser = OntologyParser(data_dir="../data")
    parser.load_ontology_files()
    parser.extract_examples()
    
    corpora = parser.get_corpora()
    assert len(corpora) >= 1
    assert corpora[0].name == "PDC"

def test_get_all_examples():
    """Test getting all examples"""
    parser = OntologyParser(data_dir="../data")
    parser.load_ontology_files()
    parser.extract_examples()
    
    examples = parser.get_all_examples()
    assert len(examples) > 0

def test_get_ontology_classes():
    """Test getting ontology classes"""
    parser = OntologyParser(data_dir="../data")
    parser.load_ontology_files()
    parser.extract_ontology_classes()
    
    classes = parser.get_ontology_classes()
    assert len(classes) > 0

if __name__ == "__main__":
    pytest.main([__file__])