from pathlib import Path
import re
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
)

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "output" / "security" / "Ayurnidaan-Security-Privacy-DPDP-Readiness-Report-2026-09-22.md"
OUTPUT = ROOT / "output" / "pdf" / "Ayurnidaan-Security-Privacy-DPDP-Test-Report-2026-09-22.pdf"

DEEP = colors.HexColor("#173D31")
GREEN = colors.HexColor("#23694F")
MINT = colors.HexColor("#E8F1EC")
GOLD = colors.HexColor("#C59332")
CREAM = colors.HexColor("#F7F4EC")
INK = colors.HexColor("#24332D")
MUTED = colors.HexColor("#68766F")
LINE = colors.HexColor("#CFD9D3")
AMBER_BG = colors.HexColor("#FFF2D5")
AMBER = colors.HexColor("#8D6414")
RED = colors.HexColor("#A63B32")

base = getSampleStyleSheet()
styles = {
    "body": ParagraphStyle("Body", parent=base["BodyText"], fontName="Helvetica", fontSize=8.2, leading=12.2, textColor=INK, spaceAfter=6),
    "small": ParagraphStyle("Small", parent=base["BodyText"], fontName="Helvetica", fontSize=7, leading=9.5, textColor=MUTED),
    "h2": ParagraphStyle("H2", parent=base["Heading1"], fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=DEEP, spaceBefore=10, spaceAfter=8, keepWithNext=True),
    "h3": ParagraphStyle("H3", parent=base["Heading2"], fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=GREEN, spaceBefore=8, spaceAfter=5, keepWithNext=True),
    "bullet": ParagraphStyle("Bullet", parent=base["BodyText"], fontName="Helvetica", fontSize=8, leading=11.5, leftIndent=12, firstLineIndent=-7, bulletIndent=2, textColor=INK, spaceAfter=3.5),
    "number": ParagraphStyle("Number", parent=base["BodyText"], fontName="Helvetica", fontSize=8, leading=11.5, leftIndent=15, firstLineIndent=-11, textColor=INK, spaceAfter=4),
    "quote": ParagraphStyle("Quote", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=8.1, leading=12, leftIndent=10, rightIndent=10, textColor=DEEP, backColor=MINT, borderColor=colors.HexColor("#B7CFC1"), borderWidth=0.6, borderPadding=9, spaceBefore=5, spaceAfter=8),
    "table": ParagraphStyle("Table", parent=base["BodyText"], fontName="Helvetica", fontSize=6.7, leading=9, textColor=INK),
    "table_head": ParagraphStyle("TableHead", parent=base["BodyText"], fontName="Helvetica-Bold", fontSize=7, leading=9.2, textColor=colors.white),
}


def inline(text: str) -> str:
    text = text.replace("—", "-").replace("–", "-").replace("‑", "-")
    placeholders = []

    def keep(value: str) -> str:
        placeholders.append(value)
        return f"@@TOKEN{len(placeholders)-1}@@"

    text = re.sub(r"\[([^\]]+)\]\((https?://[^)]+)\)", lambda m: keep(f'<link href="{escape(m.group(2))}" color="#23694F"><u>{escape(m.group(1))}</u></link>'), text)
    text = re.sub(r"`([^`]+)`", lambda m: keep(f'<font name="Courier" color="#173D31">{escape(m.group(1))}</font>'), text)
    text = escape(text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    for index, value in enumerate(placeholders):
        text = text.replace(f"@@TOKEN{index}@@", value)
    return text


def table_widths(column_count: int):
    usable = 174 * mm
    if column_count == 2:
        return [57 * mm, 117 * mm]
    if column_count == 3:
        return [43 * mm, 57 * mm, 74 * mm]
    if column_count == 4:
        return [35 * mm, 43 * mm, 46 * mm, 50 * mm]
    return [usable / column_count] * column_count


def markdown_story(markdown: str):
    lines = markdown.splitlines()
    story = []
    paragraph = []
    index = 0

    def flush():
        if paragraph:
            story.append(Paragraph(inline(" ".join(part.strip() for part in paragraph)), styles["body"]))
            paragraph.clear()

    # The first page is a designed cover, so begin parsing at the first H2.
    while index < len(lines) and not lines[index].startswith("## "):
        index += 1

    while index < len(lines):
        line = lines[index].rstrip()
        if not line:
            flush()
            index += 1
            continue

        if line.startswith("## "):
            flush()
            heading = line[3:]
            if heading == "Required release gates":
                story.append(PageBreak())
            story.append(Paragraph(inline(heading), styles["h2"]))
            index += 1
            continue
        if line.startswith("### "):
            flush()
            story.append(Paragraph(inline(line[4:]), styles["h3"]))
            index += 1
            continue

        if line.startswith("|") and index + 1 < len(lines) and re.match(r"^\|?\s*:?-+", lines[index + 1]):
            flush()
            raw_rows = []
            while index < len(lines) and lines[index].lstrip().startswith("|"):
                raw_rows.append([cell.strip() for cell in lines[index].strip().strip("|").split("|")])
                index += 1
            if len(raw_rows) >= 2:
                header = raw_rows[0]
                body = raw_rows[2:]
                data = [[Paragraph(inline(cell), styles["table_head"]) for cell in header]]
                data.extend([[Paragraph(inline(cell), styles["table"]) for cell in row] for row in body])
                table = Table(data, colWidths=table_widths(len(header)), repeatRows=1, hAlign="LEFT")
                commands = [
                    ("BACKGROUND", (0, 0), (-1, 0), DEEP),
                    ("GRID", (0, 0), (-1, -1), 0.35, LINE),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
                for row in range(1, len(data)):
                    commands.append(("BACKGROUND", (0, row), (-1, row), colors.white if row % 2 else CREAM))
                table.setStyle(TableStyle(commands))
                story.extend([table, Spacer(1, 6)])
            continue

        if line.startswith(">"):
            flush()
            quoted = []
            while index < len(lines) and lines[index].lstrip().startswith(">"):
                quoted.append(lines[index].lstrip()[1:].strip())
                index += 1
            story.append(Paragraph(inline(" ".join(quoted)), styles["quote"]))
            continue

        bullet_match = re.match(r"^-\s+(.*)", line)
        if bullet_match:
            flush()
            story.append(Paragraph("- " + inline(bullet_match.group(1)), styles["bullet"]))
            index += 1
            continue

        number_match = re.match(r"^(\d+)\.\s+(.*)", line)
        if number_match:
            flush()
            story.append(Paragraph(f"{number_match.group(1)}. " + inline(number_match.group(2)), styles["number"]))
            index += 1
            continue

        paragraph.append(line)
        index += 1

    flush()
    return story


def cover_story():
    title = Paragraph("Security, Privacy<br/>&amp; DPDP Readiness", ParagraphStyle(
        "CoverTitle", fontName="Helvetica-Bold", fontSize=29, leading=34, textColor=DEEP, alignment=TA_LEFT
    ))
    subtitle = Paragraph("Professional engineering test report", ParagraphStyle(
        "CoverSubtitle", fontName="Helvetica", fontSize=12, leading=16, textColor=GREEN
    ))
    verdict = Paragraph("CONDITIONAL TECHNICAL READINESS", ParagraphStyle(
        "Verdict", fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=AMBER, alignment=TA_CENTER
    ))
    summary = Table([
        [Paragraph("12/12", ParagraphStyle("Metric", fontName="Helvetica-Bold", fontSize=20, leading=22, textColor=GREEN, alignment=TA_CENTER)),
         Paragraph("21/21", ParagraphStyle("Metric2", fontName="Helvetica-Bold", fontSize=20, leading=22, textColor=GREEN, alignment=TA_CENTER)),
         Paragraph("0", ParagraphStyle("Metric3", fontName="Helvetica-Bold", fontSize=20, leading=22, textColor=GREEN, alignment=TA_CENTER))],
        [Paragraph("security controls", styles["small"]), Paragraph("Expo checks", styles["small"]), Paragraph("dependency vulnerabilities", styles["small"])],
    ], colWidths=[54 * mm, 54 * mm, 54 * mm])
    summary.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.6, LINE), ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
        ("BACKGROUND", (0, 0), (-1, -1), CREAM), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"), ("TOPPADDING", (0, 0), (-1, 0), 12),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 3), ("TOPPADDING", (0, 1), (-1, 1), 2),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 10),
    ]))
    meta = Table([
        [Paragraph("Assessment date", styles["small"]), Paragraph("22 September 2026", styles["body"])],
        [Paragraph("Branch", styles["small"]), Paragraph("dev", styles["body"])],
        [Paragraph("Commit", styles["small"]), Paragraph("d51d973", styles["body"])],
        [Paragraph("Scope", styles["small"]), Paragraph("Expo application, Supabase controls, AI and payment paths, consent, repository history, generated build and safe live probes", styles["body"])],
    ], colWidths=[38 * mm, 124 * mm])
    meta.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.35, LINE), ("BACKGROUND", (0, 0), (0, -1), MINT),
        ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7), ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    note = Paragraph(
        "No known critical or high-severity vulnerability was found in the remediated source and generated build. "
        "The hosted security controls still require deployment and authenticated retesting before production assurance or a DPDP compliance claim.",
        styles["quote"],
    )
    return [
        Spacer(1, 16 * mm),
        Paragraph("AYURNIDAAN", ParagraphStyle("Brand", fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=GOLD, charSpace=2.2)),
        Spacer(1, 11 * mm), title, Spacer(1, 4 * mm), subtitle, Spacer(1, 12 * mm),
        Table([[verdict]], colWidths=[162 * mm], style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), AMBER_BG), ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#E4C77B")),
            ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ])),
        Spacer(1, 9 * mm), summary, Spacer(1, 10 * mm), meta, Spacer(1, 9 * mm), note, PageBreak()
    ]


def decorate_first(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(MINT)
    canvas.rect(0, 0, A4[0], 12 * mm, fill=1, stroke=0)
    canvas.setFillColor(DEEP)
    canvas.rect(A4[0] - 17 * mm, 0, 17 * mm, A4[1], fill=1, stroke=0)
    canvas.restoreState()


def decorate_later(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.45)
    canvas.line(18 * mm, 281 * mm, 192 * mm, 281 * mm)
    canvas.setFont("Helvetica-Bold", 7)
    canvas.setFillColor(GREEN)
    canvas.drawString(18 * mm, 285 * mm, "AYURNIDAAN")
    canvas.setFont("Helvetica", 6.7)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(192 * mm, 285 * mm, "Security, Privacy and DPDP Readiness Report")
    canvas.line(18 * mm, 14 * mm, 192 * mm, 14 * mm)
    canvas.drawString(18 * mm, 9.5 * mm, "Assessment date: 22 September 2026 | Commit d51d973")
    canvas.drawRightString(192 * mm, 9.5 * mm, f"Page {doc.page}")
    canvas.restoreState()


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    markdown = SOURCE.read_text(encoding="utf-8")
    doc = SimpleDocTemplate(
        str(OUTPUT), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=20 * mm, bottomMargin=18 * mm,
        title="Ayurnidaan Security, Privacy and DPDP Readiness Report",
        author="Ayurnidaan Health Pvt Ltd",
        subject="Professional engineering security and privacy test report",
    )
    story = cover_story() + markdown_story(markdown)
    doc.build(story, onFirstPage=decorate_first, onLaterPages=decorate_later)
    print(OUTPUT)


if __name__ == "__main__":
    main()
