import zipfile
import xml.etree.ElementTree as ET

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
                        # A paragraph can contain multiple text nodes, let's extract them
                        texts = [t.text for t in child.findall('.//w:t', namespaces) if t.text]
                        p_text = "".join(texts)
                        if p_text.strip():
                            output.append(p_text)
                    elif child.tag.endswith('tbl'):
                        output.append("\n=== TABLE START ===")
                        for row in child.findall('.//w:tr', namespaces):
                            row_text = []
                            for cell in row.findall('.//w:tc', namespaces):
                                # Gather all paragraphs in cell
                                cell_paras = []
                                for cp in cell.findall('.//w:p', namespaces):
                                    cp_text = "".join(t.text for t in cp.findall('.//w:t', namespaces) if t.text)
                                    if cp_text.strip():
                                        cell_paras.append(cp_text)
                                cell_text = " ".join(cell_paras)
                                row_text.append(cell_text.strip())
                            output.append(" | ".join(row_text))
                        output.append("=== TABLE END ===\n")
            
            return "\n".join(output)
    except Exception as e:
        return f"Error: {e}"

print("--- 2.4.docx ---")
print(get_docx_text(r"d:\PTTK Hệ Thống\PROJECT\2.4.docx"))

print("\n\n--- CHƯƠNG 1 + 2.docx ---")
text = get_docx_text(r"d:\PTTK Hệ Thống\PROJECT\CHƯƠNG 1 + 2.docx")
if len(text) > 10000:
    print(text[:10000])
    print("... TRUNCATED ...")
else:
    print(text)
