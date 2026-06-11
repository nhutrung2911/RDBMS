import zipfile
import xml.etree.ElementTree as ET
import os

def get_docx_text(path):
    namespaces = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    }
    try:
        with zipfile.ZipFile(path) as docx:
            xml_content = docx.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            output = []
            body = root.find('.//w:body', namespaces)
            if body is not None:
                for child in body:
                    if child.tag.endswith('p'):
                        texts = [t.text for t in child.findall('.//w:t', namespaces) if t.text]
                        p_text = "".join(texts)
                        if p_text.strip():
                            output.append(p_text)
                    elif child.tag.endswith('tbl'):
                        output.append("\n=== TABLE START ===")
                        for row in child.findall('.//w:tr', namespaces):
                            row_text = []
                            for cell in row.findall('.//w:tc', namespaces):
                                cell_paras = []
                                for cp in cell.findall('.//w:p', namespaces):
                                    cp_text = "".join(t.text for t in cp.findall('.//w:t', namespaces) if t.text)
                                    if cp_text.strip():
                                        cell_paras.append(cp_text)
                                cell_text = " ".join(cell_paras)
                                row_text.append(cell_text.strip())
                            row_text = [r for r in row_text if r]
                            output.append(" | ".join(row_text))
                        output.append("=== TABLE END ===\n")
            
            return "\n".join(output)
    except Exception as e:
        return f"Error: {e}"

docx_path = r"d:\He Quan Tri CSDL\FE_RDBMS\baimau.docx"
output_path = r"d:\He Quan Tri CSDL\FE_RDBMS\scratch\baimau_extracted.txt"

text = get_docx_text(docx_path)
with open(output_path, "w", encoding="utf-8") as f:
    f.write(text)

print(f"Extracted {len(text)} characters to {output_path}")
