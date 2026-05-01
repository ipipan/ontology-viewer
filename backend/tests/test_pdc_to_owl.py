"""Tests for the PDC XML to OWL converter."""
from __future__ import annotations

from pathlib import Path
from xml.etree import ElementTree as ET

import pytest

from src.pdc_to_owl import (
    AnnotationSpan,
    DiscourseRelation,
    LabelConfig,
    LABEL_MAP,
    REL_NAME_MAP,
    RelLink,
    RelationComponent,
    TokenInfo,
    build_relations_from_rel_links,
    generate_owl_xml,
    group_annotation_spans,
    parse_pdc_xml,
    parse_rel_xml,
    parse_sentence_tokens,
)


# ── AnnotationSpan tests ─────────────────────────────────────────────────────


class TestAnnotationSpan:
    """Tests for AnnotationSpan.build_text()."""

    def test_single_token(self) -> None:
        span = AnnotationSpan(
            label="result", ann_id=1,
            tokens=["Dowiedz"], no_space_flags=[False], first_token_index=0,
        )
        assert span.build_text() == "Dowiedz"

    def test_multiple_tokens_with_spaces(self) -> None:
        span = AnnotationSpan(
            label="result", ann_id=1,
            tokens=["Dowiedz", "się", "więcej"],
            no_space_flags=[False, False, False], first_token_index=0,
        )
        assert span.build_text() == "Dowiedz się więcej"

    def test_no_space_flag(self) -> None:
        span = AnnotationSpan(
            label="result", ann_id=1,
            tokens=["USB", "."], no_space_flags=[False, True], first_token_index=0,
        )
        assert span.build_text() == "USB."

    def test_empty_tokens(self) -> None:
        span = AnnotationSpan(
            label="result", ann_id=1,
            tokens=[], no_space_flags=[], first_token_index=0,
        )
        assert span.build_text() == ""


# ── Label map tests ──────────────────────────────────────────────────────────


class TestLabelMap:
    """Tests for the LABEL_MAP configuration."""

    def test_all_pdc_labels_covered(self) -> None:
        expected_labels: set[str] = {
            "achievement", "after", "antecedent", "antecedent_act",
            "before", "broad", "conj_argument_1", "conj_argument_2",
            "consequent", "contr_argument_1", "contr_argument_2",
            "dependent_act", "disfavoured_alternative",
            "disj_argument_1", "disj_argument_2",
            "enablement", "exclusion", "expander",
            "expectation_denier", "expectation_raiser",
            "favoured_alternative", "feedback_act", "feedback_scope",
            "goal", "instance", "judgement", "means", "metaoperator",
            "narrative", "negated_antecedent", "reason",
            "regular", "result", "set",
            "simil_argument_1", "simil_argument_2",
            "situation", "specific",
            "synch_argument_1", "synch_argument_2",
            "rest_argument_1", "rest_argument_2",
        }
        for label in expected_labels:
            assert label in LABEL_MAP, f"Label '{label}' missing from LABEL_MAP"

    def test_metaoperator_is_connective(self) -> None:
        assert LABEL_MAP["metaoperator"].is_connective is True

    def test_cause_labels(self) -> None:
        assert LABEL_MAP["result"].relation == "Cause"
        assert LABEL_MAP["result"].owl_class == "Result"
        assert LABEL_MAP["result"].property_name == "hasResult"
        assert LABEL_MAP["reason"].relation == "Cause"

    def test_conjunction_labels(self) -> None:
        assert LABEL_MAP["conj_argument_1"].relation == "Conjunction"
        assert LABEL_MAP["conj_argument_1"].owl_class == "Arg1"
        assert LABEL_MAP["conj_argument_2"].relation == "Conjunction"
        assert LABEL_MAP["conj_argument_2"].owl_class == "Arg2"


class TestRelNameMap:
    """Tests for the REL_NAME_MAP configuration."""

    def test_key_relation_names(self) -> None:
        assert REL_NAME_MAP["conjunction"] == "Conjunction"
        assert REL_NAME_MAP["cause"] == "Cause"
        assert REL_NAME_MAP["manner"] == "Manner"
        assert REL_NAME_MAP["exemplification"] == "Exemplification"


# ── XML Parsing tests ────────────────────────────────────────────────────────


class TestParseSentenceTokens:
    """Tests for parse_sentence_tokens()."""

    def test_simple_sentence(self) -> None:
        xml_str: str = """
        <sentence id="sent1">
            <tok>
                <orth>Hello</orth>
                <ann chan="result">123</ann>
            </tok>
            <tok>
                <orth>world</orth>
                <ann chan="result">123</ann>
            </tok>
        </sentence>
        """
        el: ET.Element = ET.fromstring(xml_str)
        tokens: list[TokenInfo] = parse_sentence_tokens(el)
        assert len(tokens) == 2
        assert tokens[0].text == "Hello"
        assert tokens[0].annotations == {"result": 123}

    def test_ns_marker(self) -> None:
        xml_str: str = """
        <sentence id="sent1">
            <tok><orth>USB</orth><ann chan="result">1</ann></tok>
            <ns/>
            <tok><orth>.</orth><ann chan="result">1</ann></tok>
        </sentence>
        """
        el: ET.Element = ET.fromstring(xml_str)
        tokens: list[TokenInfo] = parse_sentence_tokens(el)
        assert tokens[1].no_space_before is True

    def test_zero_annotations_parsed(self) -> None:
        xml_str: str = """
        <sentence id="sent1">
            <tok><orth>text</orth>
                <ann chan="result">0</ann>
                <ann chan="means">456</ann>
            </tok>
        </sentence>
        """
        el: ET.Element = ET.fromstring(xml_str)
        tokens: list[TokenInfo] = parse_sentence_tokens(el)
        assert tokens[0].annotations == {"result": 0, "means": 456}


class TestGroupAnnotationSpans:
    """Tests for group_annotation_spans()."""

    def test_groups_by_label_and_id(self) -> None:
        tokens: list[TokenInfo] = [
            TokenInfo("Dowiedz", False, {"conj_argument_1": 123}),
            TokenInfo("się", False, {"conj_argument_1": 123}),
            TokenInfo("i", False, {"metaoperator": 456}),
            TokenInfo("poznaj", False, {"conj_argument_2": 789}),
        ]
        spans = group_annotation_spans(tokens)
        assert ("conj_argument_1", 123) in spans
        assert spans[("conj_argument_1", 123)].tokens == ["Dowiedz", "się"]
        assert ("metaoperator", 456) in spans
        assert ("conj_argument_2", 789) in spans

    def test_skips_zero_ids(self) -> None:
        tokens: list[TokenInfo] = [
            TokenInfo("text", False, {"result": 0, "means": 100}),
        ]
        spans = group_annotation_spans(tokens)
        assert ("result", 0) not in spans
        assert ("means", 100) in spans


# ── Rel.xml parsing tests ────────────────────────────────────────────────────


class TestParseRelXml:
    """Tests for parse_rel_xml()."""

    def test_parse_rel_links(self, tmp_path: Path) -> None:
        rel_xml: str = """<?xml version="1.0" encoding="UTF-8"?>
        <relations>
            <rel name="conjunction" set="test">
                <from sent="sent1" chan="metaoperator">100</from>
                <to sent="sent1" chan="conj_argument_1">200</to>
            </rel>
            <rel name="conjunction" set="test">
                <from sent="sent1" chan="metaoperator">100</from>
                <to sent="sent1" chan="conj_argument_2">300</to>
            </rel>
        </relations>
        """
        rel_file: Path = tmp_path / "test.rel.xml"
        rel_file.write_text(rel_xml, encoding="utf-8")
        links: list[RelLink] = parse_rel_xml(rel_file)
        assert len(links) == 2
        assert links[0].from_id == 100
        assert links[0].to_chan == "conj_argument_1"
        assert links[0].to_id == 200
        assert links[1].to_chan == "conj_argument_2"
        assert links[1].to_id == 300


class TestBuildRelationsFromRelLinks:
    """Tests for build_relations_from_rel_links()."""

    def test_builds_conjunction(self) -> None:
        links: list[RelLink] = [
            RelLink("conjunction", "sent1", "metaoperator", 100, "sent1", "conj_argument_1", 200),
            RelLink("conjunction", "sent1", "metaoperator", 100, "sent1", "conj_argument_2", 300),
        ]
        all_spans: dict[str, dict[tuple[str, int], AnnotationSpan]] = {
            "sent1": {
                ("metaoperator", 100): AnnotationSpan("metaoperator", 100, ["i"], [False], 2),
                ("conj_argument_1", 200): AnnotationSpan("conj_argument_1", 200, ["Dowiedz", "się"], [False, False], 0),
                ("conj_argument_2", 300): AnnotationSpan("conj_argument_2", 300, ["poznaj"], [False], 3),
            }
        }
        relations = build_relations_from_rel_links(links, all_spans, "doc1")
        assert len(relations) == 1
        rel = relations[0]
        assert rel.relation_type == "Conjunction"
        assert len(rel.components) == 3  # arg1 + connective + arg2

    def test_cross_sentence_cause(self) -> None:
        """Test a cause relation where metaoperator is in sent9 but result is in sent8."""
        links: list[RelLink] = [
            RelLink("cause", "sent9", "metaoperator", 500, "sent8", "result", 600),
            RelLink("cause", "sent9", "metaoperator", 500, "sent9", "reason", 700),
        ]
        all_spans: dict[str, dict[tuple[str, int], AnnotationSpan]] = {
            "sent8": {
                ("result", 600): AnnotationSpan("result", 600, ["wynik"], [False], 0),
            },
            "sent9": {
                ("metaoperator", 500): AnnotationSpan("metaoperator", 500, ["bowiem"], [False], 5),
                ("reason", 700): AnnotationSpan("reason", 700, ["przyczyna"], [False], 6),
            },
        }
        relations = build_relations_from_rel_links(links, all_spans, "doc1")
        assert len(relations) == 1
        assert relations[0].relation_type == "Cause"
        assert len(relations[0].components) == 3


# ── Integration tests ─────────────────────────────────────────────────────────


class TestIntegration:
    """Integration tests using the actual PDC example files."""

    EXAMPLE_PATH: Path = Path(__file__).parent.parent.parent / "new_data" / "pdc_example" / "00116734.xml"
    REL_PATH: Path = Path(__file__).parent.parent.parent / "new_data" / "pdc_example" / "00116734.rel.xml"

    @pytest.mark.skipif(
        not (Path(__file__).parent.parent.parent / "new_data" / "pdc_example" / "00116734.xml").exists(),
        reason="PDC example file not available",
    )
    def test_parse_with_rel_xml(self) -> None:
        relations = parse_pdc_xml(self.EXAMPLE_PATH, self.REL_PATH)
        assert len(relations) > 0
        relation_types: set[str] = {r.relation_type for r in relations}
        assert "Conjunction" in relation_types
        assert "Cause" in relation_types
        assert "Manner" in relation_types
        assert "Exemplification" in relation_types

    @pytest.mark.skipif(
        not (Path(__file__).parent.parent.parent / "new_data" / "pdc_example" / "00116734.xml").exists(),
        reason="PDC example file not available",
    )
    def test_generate_owl_output(self, tmp_path: Path) -> None:
        relations = parse_pdc_xml(self.EXAMPLE_PATH, self.REL_PATH)
        output_path: Path = tmp_path / "output.owl"
        generate_owl_xml(relations, "00116734", output_path)
        assert output_path.exists()
        tree: ET.ElementTree = ET.parse(str(output_path))
        root: ET.Element = tree.getroot()
        assert "RDF" in root.tag
        ns: dict[str, str] = {"owl": "http://www.w3.org/2002/07/owl#"}
        individuals: list[ET.Element] = root.findall(".//owl:NamedIndividual", ns)
        assert len(individuals) > 0
