# backend/app/services/pdf_service.py
import os
from fpdf import FPDF
from datetime import datetime

class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, 'Intelliflow Report', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()} | Generated on {datetime.now().strftime("%Y-%m-%d %H:%M")}', 0, 0, 'C')

def generate_pdf(content: str, filename: str = "report.pdf") -> str:
    """
    Generates a PDF file from text content.
    Returns the path to the generated PDF.
    """
    try:
        output_dir = "./generated_reports"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        file_path = os.path.join(output_dir, filename)
        
        pdf = PDF()
        pdf.add_page()
        pdf.set_font("Arial", size=11)
        
        # Split content by lines to handle multi-line text correctly
        # FPDF.multi_cell is great for this
        pdf.multi_cell(0, 10, txt=content)
        
        pdf.output(file_path)
        return f"PDF generated successfully at {file_path}"
    except Exception as e:
        print(f"PDF generation error: {e}")
        return f"Error: Could not generate PDF. Details: {e}"
