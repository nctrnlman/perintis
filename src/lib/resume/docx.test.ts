import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { analyzeDocxStructure, extractDocxText } from "./docx";

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

async function makeDocx(options: {
  documentXml: string;
  headerXml?: string;
}): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES);
  zip.file("_rels/.rels", RELS);
  zip.file("word/document.xml", options.documentXml);
  if (options.headerXml) {
    zip.file("word/header1.xml", options.headerXml);
  }
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

const SIMPLE_DOC = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body><w:p><w:r><w:t>Budi Santoso, Software Engineer</w:t></w:r></w:p></w:body>
</w:document>`;

const DOC_WITH_TABLE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p><w:r><w:t>Resume text</w:t></w:r></w:p>
<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Cell</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
</w:body>
</w:document>`;

const HEADER_WITH_CONTENT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:p><w:r><w:t>budi@example.com | 08123456789</w:t></w:r></w:p>
</w:hdr>`;

describe("extractDocxText", () => {
  it("extracts visible text", async () => {
    const buffer = await makeDocx({ documentXml: SIMPLE_DOC });
    const text = await extractDocxText(buffer);
    expect(text).toContain("Budi Santoso");
  });
});

describe("analyzeDocxStructure", () => {
  it("does not flag a document without a table", async () => {
    const buffer = await makeDocx({ documentXml: SIMPLE_DOC });
    const findings = await analyzeDocxStructure(buffer);
    expect(findings.some((f) => f.category === "table-detected")).toBe(false);
  });

  it("flags a document with a table", async () => {
    const buffer = await makeDocx({ documentXml: DOC_WITH_TABLE });
    const findings = await analyzeDocxStructure(buffer);
    expect(findings.some((f) => f.category === "table-detected")).toBe(true);
  });

  it("flags a header with content", async () => {
    const buffer = await makeDocx({
      documentXml: SIMPLE_DOC,
      headerXml: HEADER_WITH_CONTENT,
    });
    const findings = await analyzeDocxStructure(buffer);
    expect(findings.some((f) => f.category === "header-footer-content")).toBe(true);
  });

  it("does not flag when there is no header part", async () => {
    const buffer = await makeDocx({ documentXml: SIMPLE_DOC });
    const findings = await analyzeDocxStructure(buffer);
    expect(findings.some((f) => f.category === "header-footer-content")).toBe(false);
  });
});
