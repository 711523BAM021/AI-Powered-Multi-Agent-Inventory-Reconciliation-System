import os
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from app.models.inventory import Report, Reconciliation, Discrepancy
from app.models.user import User


class ReportService:
    PRIMARY = HexColor("#2E4265")
    SECONDARY = HexColor("#8599AB")
    ACCENT = HexColor("#A8B5C2")
    SURFACE = HexColor("#D5D5D6")
    WHITE = HexColor("#FFFFFF")
    BLACK = HexColor("#1a1a1a")

    @staticmethod
    def generate_pdf_report(db: Session, recon_id: int, user: User) -> Report:
        recon = db.query(Reconciliation).filter(Reconciliation.id == recon_id).first()
        if not recon:
            raise HTTPException(status_code=404, detail="Reconciliation not found")

        discrepancies = (
            db.query(Discrepancy)
            .filter(Discrepancy.reconciliation_id == recon_id)
            .all()
        )

        os.makedirs("reports", exist_ok=True)
        file_path = f"reports/reconciliation_{recon_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"

        doc = SimpleDocTemplate(
            file_path,
            pagesize=letter,
            rightMargin=50,
            leftMargin=50,
            topMargin=50,
            bottomMargin=50,
        )

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name="ReportTitle",
            parent=styles["Title"],
            fontSize=22,
            textColor=ReportService.PRIMARY,
            spaceAfter=6,
            alignment=TA_CENTER,
        ))
        styles.add(ParagraphStyle(
            name="SectionHead",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=ReportService.PRIMARY,
            spaceBefore=16,
            spaceAfter=8,
        ))
        styles.add(ParagraphStyle(
            name="BodyText2",
            parent=styles["BodyText"],
            fontSize=10,
            textColor=ReportService.BLACK,
            spaceAfter=6,
        ))
        styles.add(ParagraphStyle(
            name="SubInfo",
            parent=styles["Normal"],
            fontSize=9,
            textColor=ReportService.SECONDARY,
            alignment=TA_CENTER,
            spaceAfter=16,
        ))

        elements = []

        # Title
        elements.append(Paragraph("Inventory Reconciliation Report", styles["ReportTitle"]))
        elements.append(Paragraph(
            f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')} | Reconciliation ID: {recon_id}",
            styles["SubInfo"],
        ))
        elements.append(HRFlowable(width="100%", color=ReportService.PRIMARY, thickness=2))
        elements.append(Spacer(1, 12))

        # KPI Summary
        elements.append(Paragraph("Key Performance Indicators", styles["SectionHead"]))
        total_issues = (
            recon.missing_assets_count
            + recon.untracked_assets_count
            + recon.config_mismatch_count
            + recon.naming_mismatch_count
        )
        total_assets = max(recon.total_csv_assets, 1)
        compliance = round(((total_assets - recon.missing_assets_count) / total_assets) * 100, 1)

        kpi_data = [
            ["Metric", "Value"],
            ["CSV Assets", str(recon.total_csv_assets)],
            ["Live (JSON) Assets", str(recon.total_json_assets)],
            ["Missing Assets", str(recon.missing_assets_count)],
            ["Untracked Assets", str(recon.untracked_assets_count)],
            ["Config Mismatches", str(recon.config_mismatch_count)],
            ["Naming Mismatches", str(recon.naming_mismatch_count)],
            ["Total Discrepancies", str(total_issues)],
            ["Compliance Rate", f"{compliance}%"],
        ]

        kpi_table = Table(kpi_data, colWidths=[3.5 * inch, 2.5 * inch])
        kpi_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), ReportService.PRIMARY),
            ("TEXTCOLOR", (0, 0), (-1, 0), ReportService.WHITE),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
            ("TOPPADDING", (0, 0), (-1, 0), 10),
            ("BACKGROUND", (0, 1), (-1, -1), ReportService.SURFACE),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [ReportService.WHITE, ReportService.SURFACE]),
            ("GRID", (0, 0), (-1, -1), 0.5, ReportService.ACCENT),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 1), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ]))
        elements.append(kpi_table)
        elements.append(Spacer(1, 16))

        # Executive Summary
        if recon.executive_summary:
            elements.append(Paragraph("Executive Summary", styles["SectionHead"]))
            for line in recon.executive_summary.split("\n"):
                if line.strip():
                    elements.append(Paragraph(line.strip(), styles["BodyText2"]))
            elements.append(Spacer(1, 12))

        # AI Analysis
        if recon.ai_analysis:
            elements.append(Paragraph("AI Analysis", styles["SectionHead"]))
            for line in recon.ai_analysis.split("\n"):
                if line.strip():
                    elements.append(Paragraph(line.strip(), styles["BodyText2"]))
            elements.append(Spacer(1, 12))

        # Discrepancy Details
        if discrepancies:
            elements.append(Paragraph("Discrepancy Details", styles["SectionHead"]))
            disc_data = [["Type", "CSV Asset", "JSON Asset", "Severity", "Details"]]
            for d in discrepancies[:50]:
                disc_data.append([
                    d.discrepancy_type.value.replace("_", " "),
                    d.csv_asset_id or "—",
                    d.json_asset_id or "—",
                    d.severity or "—",
                    (d.details or "")[:60],
                ])

            disc_table = Table(disc_data, colWidths=[1.2 * inch, 1 * inch, 1 * inch, 0.8 * inch, 2 * inch])
            disc_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), ReportService.PRIMARY),
                ("TEXTCOLOR", (0, 0), (-1, 0), ReportService.WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [ReportService.WHITE, ReportService.SURFACE]),
                ("GRID", (0, 0), (-1, -1), 0.5, ReportService.ACCENT),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]))
            elements.append(disc_table)

        # Recommendations
        if recon.recommendations:
            elements.append(Spacer(1, 12))
            elements.append(Paragraph("Recommendations", styles["SectionHead"]))
            recs = recon.recommendations
            if isinstance(recs, dict) and "recommendations" in recs:
                for rec in recs["recommendations"]:
                    text = rec.get("text", str(rec)) if isinstance(rec, dict) else str(rec)
                    for line in text.split("\n"):
                        if line.strip():
                            elements.append(Paragraph(f"• {line.strip()}", styles["BodyText2"]))

        doc.build(elements)

        report = Report(
            reconciliation_id=recon_id,
            generated_by_id=user.id,
            report_type="PDF",
            file_path=file_path,
            executive_summary=recon.executive_summary,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report
