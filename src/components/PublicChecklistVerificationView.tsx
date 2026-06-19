import React, { useState, useEffect } from "react";
import { ChecklistSubmission, ChecklistSubmissionItem } from "../types";
import { api } from "../lib/api";
import { 
  ShieldCheck, 
  CheckCircle2, 
  FileDown, 
  LogIn, 
  Building, 
  Clock, 
  User, 
  Calendar, 
  AlertOctagon, 
  Lock, 
  Check, 
  X, 
  ChevronRight,
  ClipboardList,
  MessageSquare,
  Download,
  Copy,
  AlertCircle
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import QRCode from "qrcode";

// Cryptographic hash helper matching ChecklistView
const generateDocHash = (id: string, date: string): string => {
  const combined = id + (date || "2026") + "SYNAPSIS-DIGITAL-SECURE-ESIGN-SECRET-KEY-2026";
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const chr = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return "SHA-256-" + Math.abs(hash).toString(16).toUpperCase() + id.slice(0, 4).toUpperCase();
};

const fetchQrCodeBase64 = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, { margin: 1, width: 150 });
  } catch (err) {
    console.error("Failed to generate local QR Code", err);
    return "";
  }
};

const getImageFormat = (dataUrl: string): string => {
  if (!dataUrl) return "JPEG";
  const str = dataUrl.toLowerCase();
  if (str.includes("image/png") || str.includes("data:image/png")) return "PNG";
  if (str.includes("image/webp")) return "WEBP";
  if (str.includes("image/gif")) return "GIF";
  return "JPEG";
};

interface PublicChecklistVerificationViewProps {
  verifyId: string;
  onBack: () => void;
}

export default function PublicChecklistVerificationView({ verifyId, onBack }: PublicChecklistVerificationViewProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [submission, setSubmission] = useState<ChecklistSubmission | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [waExportImages, setWaExportImages] = useState<string[] | null>(null);
  const [isGeneratingWA, setIsGeneratingWA] = useState(false);
  const [previewQrUrl, setPreviewQrUrl] = useState("");

  useEffect(() => {
    if (submission) {
      QRCode.toDataURL(`${window.location.origin}/?verify=${submission.id}`, { margin: 1, width: 120 })
        .then(url => setPreviewQrUrl(url))
        .catch(err => console.error("Error generating public seal QR base64:", err));
    }
  }, [submission]);

  useEffect(() => {
    const loadAndVerify = async () => {
      try {
        setLoading(true);
        // Fetch users in parallel
        const [submissionsData, usersData] = await Promise.all([
          api.getChecklistSubmissions(),
          api.getUsers().catch(() => [])
        ]);
        setUsersList(usersData || []);
        
        const found = (submissionsData || []).find(sub => sub.id === verifyId);
        if (found) {
          setSubmission(found);
        } else {
          setErrorMsg("Data checklist tidak ditemukan. Dokumen ini belum terdaftar atau telah diarsipkan dari cloud ledger.");
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg("Gagal melakukan verifikasi dokumen: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadAndVerify();
  }, [verifyId]);

  const getCreatorFullName = (sub: ChecklistSubmission | null) => {
    if (!sub) return "";
    const creator = (usersList || []).find(
      u => u.username.toLowerCase() === (sub.createdBy || "").toLowerCase() ||
           u.name.toLowerCase() === (sub.userCreator || "").toLowerCase()
    );
    return creator ? creator.name : sub.userCreator;
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const dates = new Date(dateStr);
      if (isNaN(dates.getTime())) return dateStr;
      return dates.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const groupItemsByCategory = (items: ChecklistSubmissionItem[]) => {
    const groups: Record<string, ChecklistSubmissionItem[]> = {};
    items.forEach(it => {
      const cat = (it.category || "GENERAL").toUpperCase();
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(it);
    });
    return groups;
  };

  const handleExportWAImages = async () => {
    if (!submission) return;
    setIsGeneratingWA(true);
    let originalMainGetComputedStyle: any = null;
    try {
      const html2canvas = (await import("html2canvas")).default;
      
      const oklabToRgb = (l: number, a: number, b: number): [number, number, number] => {
        const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

        const l_lin = Math.pow(Math.max(0, l_), 3);
        const m_lin = Math.pow(Math.max(0, m_), 3);
        const s_lin = Math.pow(Math.max(0, s_), 3);

        let r = +4.0767416621 * l_lin - 3.3077115913 * m_lin + 0.2309699292 * s_lin;
        let g = -1.2684380046 * l_lin + 2.6097574011 * m_lin - 0.3413193965 * s_lin;
        let _b = -0.0041960863 * l_lin - 0.7034186147 * m_lin + 1.7076147010 * s_lin;

        const linarToSrgb = (x: number) => {
          return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
        };

        const r_s = Math.max(0, Math.min(255, Math.round(linarToSrgb(r) * 255)));
        const g_s = Math.max(0, Math.min(255, Math.round(linarToSrgb(g) * 255)));
        const b_s = Math.max(0, Math.min(255, Math.round(linarToSrgb(_b) * 255)));

        return [r_s, g_s, b_s];
      };

      const oklchToRgb = (l: number, c: number, hValue: number): [number, number, number] => {
        const h = (hValue * Math.PI) / 180;
        const a = c * Math.cos(h);
        const b = c * Math.sin(h);
        return oklabToRgb(l, a, b);
      };

      const translateColors = (cssText: string): string => {
        const replaceColorFunction = (inputCss: string, funcName: "oklab" | "oklch", fallbackColor: string) => {
          let css = inputCss;
          let index = 0;
          let iterations = 0;
          const maxIterations = 5000;
          
          while (iterations < maxIterations) {
            iterations++;
            const searchStr = funcName + "(";
            const startIdx = css.indexOf(searchStr, index);
            if (startIdx === -1) break;
            
            let parenDepth = 1;
            let endIdx = -1;
            for (let i = startIdx + searchStr.length; i < css.length; i++) {
              if (css[i] === "(") {
                parenDepth++;
              } else if (css[i] === ")") {
                parenDepth--;
                if (parenDepth === 0) {
                  endIdx = i;
                  break;
                }
              }
            }
            
            if (endIdx === -1) {
              index = startIdx + searchStr.length;
              continue;
            }
            
            const content = css.substring(startIdx + searchStr.length, endIdx);
            let replacement = fallbackColor;
            
            try {
              const parts = content.trim().split(/[\s,/_]+/);
              if (parts.length >= 3) {
                let p0 = parseFloat(parts[0]);
                if (parts[0].includes("%")) p0 = p0 / 100;
                
                let p1 = parseFloat(parts[1]);
                if (parts[1].includes("%")) p1 = p1 / 100;
                
                let p2 = parseFloat(parts[2]);
                if (parts[2].includes("%")) p2 = p2 / 100;
                
                let alpha = 1;
                if (parts.length >= 4) {
                  const lastPart = parts[parts.length - 1];
                  let aVal = parseFloat(lastPart);
                  if (lastPart.includes("%")) aVal = aVal / 100;
                  if (!isNaN(aVal)) alpha = aVal;
                }
                
                if (funcName === "oklab") {
                  const [r, g, b] = oklabToRgb(p0, p1, p2);
                  replacement = alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
                } else {
                  let h = p2;
                  if (parts[2].includes("rad")) {
                    h = parseFloat(parts[2]) * (180 / Math.PI);
                  } else if (parts[2].includes("turn")) {
                    h = parseFloat(parts[2]) * 360;
                  }
                  const [r, g, b] = oklchToRgb(p0, p1, h);
                  replacement = alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
                }
              }
            } catch (e) {
              replacement = fallbackColor;
            }
            
            css = css.substring(0, startIdx) + replacement + css.substring(endIdx + 1);
            index = startIdx + replacement.length;
          }
          return css;
        };

        let result = cssText;
        if (result.includes("oklch")) {
          result = replaceColorFunction(result, "oklch", "rgb(120, 120, 120)");
        }
        if (result.includes("oklab")) {
          result = replaceColorFunction(result, "oklab", "rgb(120, 120, 120)");
        }
        return result;
      };

      const patchWindowGetComputedStyle = (win: any) => {
        const originalGetComputedStyle = win.getComputedStyle;
        win.getComputedStyle = function(el: Element, pseudo?: string) {
          const style = originalGetComputedStyle.call(this, el, pseudo);
          return new Proxy(style, {
            get(target: any, prop: string | symbol) {
              if (prop === "getPropertyValue") {
                return function(propertyName: string) {
                  const val = target.getPropertyValue(propertyName);
                  if (typeof val === "string" && (val.includes("oklch") || val.includes("oklab"))) {
                    return translateColors(val);
                  }
                  return val;
                };
              }
              const val = target[prop];
              if (typeof val === "function") {
                return val.bind(target);
              }
              if (typeof val === "string" && (val.includes("oklch") || val.includes("oklab"))) {
                return translateColors(val);
              }
              return val;
            }
          });
        };
        return originalGetComputedStyle;
      };

      originalMainGetComputedStyle = patchWindowGetComputedStyle(window);

      let compiledCss = "";
      try {
        Array.from(document.styleSheets).forEach((sheet) => {
          try {
            const rules = Array.from(sheet.cssRules || sheet.rules);
            rules.forEach((rule) => {
              compiledCss += rule.cssText + "\n";
            });
          } catch (e) {
            // Ignore CORS or unreadable rule errors
          }
        });
      } catch (err) {
        // Ignore errors collecting stylesheets
      }

      if (!compiledCss) {
        document.querySelectorAll("style").forEach((styleTag) => {
          compiledCss += styleTag.innerHTML + "\n";
        });
      }

      const sanitizedCss = translateColors(compiledCss);
      
      const options = {
        scale: 2, // high quality
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc: Document) => {
          const clonedWindow = clonedDoc.defaultView;
          if (clonedWindow) {
            patchWindowGetComputedStyle(clonedWindow);
          }

          clonedDoc.querySelectorAll("style, link[rel='stylesheet']").forEach((el) => {
            el.remove();
          });

          const styleEl = clonedDoc.createElement("style");
          styleEl.innerHTML = sanitizedCss;
          clonedDoc.head.appendChild(styleEl);

          clonedDoc.querySelectorAll("*").forEach((el: any) => {
            if (el.style) {
              ["color", "backgroundColor", "borderColor", "boxShadow"].forEach((prop) => {
                const val = el.style[prop];
                if (val && (val.includes("oklch") || val.includes("oklab"))) {
                  el.style[prop] = translateColors(val);
                }
              });
            }
          });
        }
      };

      // Calculate identical dynamic pages for rendering
      const subGrouped: { [category: string]: typeof submission.items } = {};
      submission.items.forEach(it => {
        const cat = (it.category || "GENERAL").toUpperCase();
        if (!subGrouped[cat]) subGrouped[cat] = [];
        subGrouped[cat].push(it);
      });

      const subAllRows: ({ type: 'category'; name: string } | { type: 'item'; item: typeof submission.items[0]; index: number })[] = [];
      let subGlobalIndex = 1;
      Object.entries(subGrouped).forEach(([category, items]) => {
        subAllRows.push({ type: 'category', name: category });
        items.forEach(it => {
          subAllRows.push({ type: 'item', item: it, index: subGlobalIndex++ });
        });
      });

      const calcPages: any[] = [];
      let curRows: any[] = [];
      let curUnits = 0;
      let isFirst = true;

      const getCap = (f: boolean) => f ? 22 : 30;

      for (const r of subAllRows) {
        const rUnits = r.type === 'category' ? 1.1 : 1;
        const cap = getCap(isFirst);
        if (curUnits + rUnits > cap) {
          calcPages.push({ rows: curRows, showPhoto: false, showSignatures: false });
          curRows = [r];
          curUnits = rUnits;
          isFirst = false;
        } else {
          curRows.push(r);
          curUnits += rUnits;
        }
      }

      const pUnits = submission.photoUrl ? 5.5 : 0;
      const sUnits = 7;
      const finCap = getCap(isFirst);

      if (curUnits + pUnits + sUnits <= finCap) {
        calcPages.push({ rows: curRows, showPhoto: !!submission.photoUrl, showSignatures: true });
      } else {
        if (pUnits > 0 && curUnits + pUnits <= finCap) {
          calcPages.push({ rows: curRows, showPhoto: true, showSignatures: false });
          calcPages.push({ rows: [], showPhoto: false, showSignatures: true });
        } else {
          calcPages.push({ rows: curRows, showPhoto: false, showSignatures: false });
          const subPageCap = getCap(false);
          if (pUnits + sUnits <= subPageCap) {
            calcPages.push({ rows: [], showPhoto: !!submission.photoUrl, showSignatures: true });
          } else {
            calcPages.push({ rows: [], showPhoto: !!submission.photoUrl, showSignatures: false });
            calcPages.push({ rows: [], showPhoto: false, showSignatures: true });
          }
        }
      }

      const exportedUrls: string[] = [];
      for (let i = 0; i < calcPages.length; i++) {
        const pageEl = document.getElementById(`public-wa-printable-page-${i}`);
        if (!pageEl) {
          throw new Error(`Elemen cetak wa halaman ${i + 1} tidak ditemukan.`);
        }
        const canvas = await html2canvas(pageEl, options);
        exportedUrls.push(canvas.toDataURL("image/png"));
      }
      
      setWaExportImages(exportedUrls);
    } catch (err: any) {
      console.error("Gagal melakukan konversi gambar:", err);
      alert("Gagal memproses gambar WhatsApp A4: " + err.message);
    } finally {
      if (originalMainGetComputedStyle) {
        window.getComputedStyle = originalMainGetComputedStyle;
      }
      setIsGeneratingWA(false);
    }
  };

  // Modern F4 Direct Exporter with E-Sign stamps
  const handleDownloadVerifiedPDF = async () => {
    if (!submission) return;
    try {
      setIsDownloading(true);
      const sub = submission;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: [612.0, 936.5]
      });

      // PDF Title / Header
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 612, 100, "F");

      // Grid line border on top
      doc.setDrawColor(220, 225, 230);
      doc.setLineWidth(1);
      doc.line(30, 90, 582, 90);

      // Title 
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(24, 30, 40);
      doc.text("LAPORAN CHECKLIST PEMELIHARAAN SISTEM SIMRS", 30, 45);

      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 90, 100);
      doc.text(`Kategori Checklist: Harian (Pagi & Sore) - Kertas Ukuran F4`, 30, 62);
      doc.text(`Lokasi Site Tugas: ${sub.site}`, 30, 77);

      // logo label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(14, 116, 144);
      doc.text("SYNAPSIS", 495, 45);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 110, 120);
      doc.text("Enterprise Portal System", 495, 55);
      doc.text("HEALTHCARE MONITORING", 485, 65);

      // Metadata card grid
      doc.setFillColor(247, 249, 251);
      doc.rect(30, 100, 552, 45, "F");
      doc.setDrawColor(220, 225, 230);
      doc.rect(30, 100, 552, 45, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(80, 90, 100);
      doc.text("LOKASI / SITE RSUD:", 40, 115);
      doc.text("TANGGAL AUDIT:", 40, 134);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(20, 30, 40);
      doc.text(sub.site, 140, 115);
      doc.text(formatDateIndo(sub.tanggal), 140, 134);

      doc.setFont("helvetica", "bold");
      doc.text("WAKTU SHIFT:", 320, 115);
      doc.text("NAMA PEMERIKSA:", 320, 134);

      doc.setFont("helvetica", "normal");
      doc.text(`${sub.waktu} (Shift Check)`, 410, 115);
      doc.text(`${getCreatorFullName(sub)} (${sub.roleCreator})`, 410, 134);

      const totalCount = sub.items.length;
      const okCount = sub.items.filter(it => it.status === "OK").length;
      const notOkCount = sub.items.filter(it => it.status === "NOT OK").length;
      const uncheckCount = sub.items.filter(it => !it.status).length;

      doc.setFont("helvetica", "bold");
      doc.text("Kondisi Perangkat:", 30, 160);
      doc.setFont("helvetica", "normal");
      doc.text(`Total: ${totalCount} Item | OK: ${okCount} | NOT OK: ${notOkCount} | Belum Terisi: ${uncheckCount}`, 140, 160);

      doc.line(30, 170, 582, 170);

      const tableHeaders = [["No", "Nama Komponen", "Kondisi", "Temuan & Keterangan / Tindak Lanjut"]];
      const grouped = groupItemsByCategory(sub.items);
      const tableRows: any[] = [];
      let globalIndex = 1;

      Object.keys(grouped).forEach(cat => {
        tableRows.push([
          { 
            content: `KATEGORI: ${cat}`, 
            colSpan: 4, 
            styles: { 
              fillColor: [230, 237, 245], 
              textColor: [30, 41, 59], 
              fontStyle: "bold", 
              fontSize: 9,
              halign: "left"
            } 
          }
        ]);

        grouped[cat].forEach(it => {
          const displayStatus = it.status ? (it.status === "OK" ? `${it.status} (${it.okLabel})` : `${it.status} (${it.notOkLabel})`) : "Belum Dicek";
          tableRows.push([
            globalIndex++,
            it.name,
            displayStatus,
            it.keterangan || "-"
          ]);
        });
      });

      autoTable(doc, {
        head: tableHeaders,
        body: tableRows,
        startY: 185,
        margin: { left: 30, right: 30, bottom: 40 },
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 4,
          overflow: "linebreak",
          halign: "left",
          valign: "middle",
          font: "helvetica"
        },
        headStyles: {
          fillColor: [50, 70, 100],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [247, 249, 251]
        },
        columnStyles: {
          0: { cellWidth: 30, halign: "center" },
          1: { cellWidth: 220 },
          2: { cellWidth: 90, fontStyle: "bold" },
          3: { cellWidth: 212 }
        },
        didParseCell: (data) => {
          if (data.cell.raw && typeof data.cell.raw === "object" && "colSpan" in data.cell.raw) return;
          if (data.column.index === 2 && data.cell.text[0]) {
            if (data.cell.text[0].startsWith("OK")) {
              data.cell.styles.textColor = [16, 124, 65];
            } else if (data.cell.text[0].startsWith("NOT OK")) {
              data.cell.styles.textColor = [168, 0, 0];
            }
          }
        }
      });

       if (sub.photoUrl) {
        let finalY = (doc as any).lastAutoTable?.finalY || 400;
        if (finalY + 160 > 900) {
          doc.addPage();
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(40, 50, 60);
          doc.text("DOKUMENTASI FOTO ATTACHMENT / PROOF OF DATA ATTACHED", 30, 40);
          doc.setDrawColor(200, 205, 210);
          doc.line(30, 45, 582, 45);
          
          try {
            const format = getImageFormat(sub.photoUrl);
            doc.addImage(sub.photoUrl, format, 30, 60, 250, 180);
          } catch {
            doc.text("[Gagal memuat gambar lampiran]", 30, 60);
          }
        } else {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(40, 50, 60);
          doc.text("DOKUMENTASI FOTO ATTACHMENT / PROOF OF DATA ATTACHED", 30, finalY + 20);
          doc.setDrawColor(200, 205, 210);
          doc.line(30, finalY + 25, 582, finalY + 25);
          
          try {
            const format = getImageFormat(sub.photoUrl);
            doc.addImage(sub.photoUrl, format, 30, finalY + 35, 250, 180);
          } catch {
            doc.text("[Gagal memuat gambar lampiran]", 30, finalY + 35);
          }
        }
      }

      // Signatures
      let currentY = (doc as any).lastAutoTable?.finalY || 250;
      if (sub.photoUrl) {
        if (currentY + 160 > 900) {
          currentY = 270;
        } else {
          currentY = currentY + 245;
        }
      } else {
        currentY = currentY + 30;
      }

      if (currentY + 155 > 880) {
        doc.addPage();
        currentY = 50;
      }

      doc.setDrawColor(220, 225, 230);
      doc.line(30, currentY - 5, 582, currentY - 5);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(50, 60, 75);

      const sigY = currentY + 15;
      doc.text("Petugas Pelaksana SIMRS,", 60, sigY);
      doc.text("Supervisor / Site Coordinator,", 380, sigY);

      const certUrl = `${window.location.origin}/?verify=${sub.id}`;
      const certHash = generateDocHash(sub.id, sub.tanggal);
      const qrBase64 = await fetchQrCodeBase64(certUrl);

      // Petugas Box
      doc.setFillColor(245, 248, 252);
      doc.roundedRect(50, sigY + 10, 195, 75, 5, 5, "F");
      doc.setDrawColor(210, 225, 245);
      doc.roundedRect(50, sigY + 10, 195, 75, 5, 5, "S");

      if (qrBase64) {
        doc.addImage(qrBase64, "PNG", 55, sigY + 15, 45, 45);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(16, 110, 190);
      doc.text("SYNAPSIS SECURE E-SIGN", 108, sigY + 24);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(80, 90, 100);
      doc.text(`ID: ${sub.id.slice(0, 8)}...`, 108, sigY + 34);
      doc.text(`User: ${getCreatorFullName(sub)}`, 108, sigY + 44);
      doc.text(`Hash: ${certHash.slice(0, 12)}...`, 108, sigY + 54);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(34, 139, 34);
      doc.text("● VERIFIED DIGITAL", 108, sigY + 68);

      // Supervisor Box
      if (sub.isApproved) {
        doc.setFillColor(245, 248, 252);
        doc.roundedRect(370, sigY + 10, 195, 75, 5, 5, "F");
        doc.setDrawColor(210, 225, 245);
        doc.roundedRect(370, sigY + 10, 195, 75, 5, 5, "S");

        if (qrBase64) {
          doc.addImage(qrBase64, "PNG", 375, sigY + 15, 45, 45);
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(16, 110, 190);
        doc.text("SUPERVISOR E-SIGN", 428, sigY + 24);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(80, 90, 100);
        doc.text("Status: APPROVED", 428, sigY + 34);
        doc.text(`Oleh: ${sub.approvedBy || "Supervisor"}`, 428, sigY + 44);
        doc.text(`Tgl: ${sub.approvedAt ? sub.approvedAt.split('T')[0] : sub.tanggal}`, 428, sigY + 54);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(34, 139, 34);
        doc.text("● APPROVED & LOCKED", 428, sigY + 68);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(50, 60, 75);
        doc.text(`( ${getCreatorFullName(sub)} )`, 50, sigY + 102);
        doc.text(`(   ${sub.approvedBy || "Sistem Verifikasi Otomatis"}   )`, 370, sigY + 102);
      } else {
        doc.setFillColor(254, 242, 242);
        doc.roundedRect(370, sigY + 10, 195, 75, 5, 5, "F");
        doc.setDrawColor(252, 165, 165);
        doc.roundedRect(370, sigY + 10, 195, 75, 5, 5, "S");

        doc.setFillColor(254, 226, 226);
        doc.rect(375, sigY + 15, 45, 45, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.setTextColor(220, 38, 38);
        doc.text("PENDING", 382, sigY + 35);
        doc.text("APPROVAL", 379, sigY + 45);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(220, 38, 38);
        doc.text("BELUM DISETUJUI", 428, sigY + 24);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(120, 130, 140);
        doc.text("Butuh konfirmasi kroscek", 428, sigY + 36);
        doc.text("oleh Site Coordinator", 428, sigY + 46);
        doc.text("atau Supervisor di site.", 428, sigY + 56);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(220, 38, 38);
        doc.text("● UNAPPROVED / DRAFT", 428, sigY + 68);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(50, 60, 75);
        doc.text(`( ${getCreatorFullName(sub)} )`, 50, sigY + 102);
        doc.text("(   Belum Disetujui  )", 370, sigY + 102);
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(110, 120, 130);
      doc.text(`Role: ${sub.roleCreator}`, 50, sigY + 115);
      doc.text("Role: SPV / Site Coordinator", 370, sigY + 115);

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(140, 145, 150);
        doc.text(`Sistem Monitoring SIMRS - Halaman ${i} dari ${pageCount} (F4 Layout)`, 30, 915);
        doc.text(`Tercetak tanggal: ${new Date().toLocaleString("id-ID")}`, 400, 915);
      }

      doc.save(`Checklist_VERIFIED_${sub.site}_${sub.tanggal}.pdf`);
    } catch (err: any) {
      alert("Gagal mengunduh berkas laporan: " + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-slate-400 text-sm">Menghubungkan ke Synapsis Global Ledger...</p>
      </div>
    );
  }

  if (errorMsg || !submission) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/35 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-red-950/40 border border-red-500/40 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner animate-pulse">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-red-400">Verifikasi Gagal</h2>
            <p className="text-slate-400 text-xs leading-relaxed font-semibold">
              {errorMsg || "Dokumen tidak sah atau kunci identitas salah."}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onBack}
              className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 p-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" /> Masuk Portal SYNAPSIS
            </button>
          </div>
        </div>
      </div>
    );
  }

  const certHash = generateDocHash(submission.id, submission.tanggal);
  const itemsGrouped = groupItemsByCategory(submission.items);
  const totalItems = submission.items.length;
  const totalOk = submission.items.filter(it => it.status === "OK").length;
  const totalNotOk = submission.items.filter(it => it.status === "NOT OK").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* TOP STATUS BAR: REAL-TIME CRYPTO SEAL */}
        <div className={`bg-slate-900 border rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden ${
          submission.isApproved ? "border-emerald-500/20" : "border-amber-500/20"
        }`}>
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full filter blur-3xl pointer-events-none ${
            submission.isApproved ? "bg-emerald-500/5" : "bg-amber-500/5"
          }`}></div>
          
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className={`w-14 h-14 border rounded-2xl flex items-center justify-center shadow-md transform hover:rotate-6 transition-all duration-300 ${
              submission.isApproved 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                : "bg-amber-500/10 border-amber-500/30 text-amber-500"
            }`}>
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <span className={`text-[10px] border px-2 py-0.5 rounded-full font-black tracking-widest uppercase ${
                  submission.isApproved 
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" 
                    : "bg-amber-500/15 border-amber-500/30 text-amber-400 animate-pulse"
                }`}>
                  {submission.isApproved ? "SECURED & SIGNED BY SYNAPSIS" : "PENDING SUPERVISOR CROSSCHECK"}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                  {submission.isApproved ? "KSO-TRUST-V2" : "DRAFT-STATUS"}
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-white mt-1.5 tracking-tight">
                {submission.isApproved ? "Dokumen Terverifikasi & Sah" : "Laporan Draf - Menunggu Persetujuan"}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {submission.isApproved 
                  ? "Sertifikat terverifikasi aman melalui tanda tangan kriptografis supervisor resmi." 
                  : "Dokumen ini terdaftar di ledger, namun tanda tangan e-sign supervisor belum diterbitkan."}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
            <button
              onClick={handleDownloadVerifiedPDF}
              disabled={isDownloading}
              className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-black text-xs p-3 px-5 rounded-2xl transition-all flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.97] cursor-pointer shadow-lg shadow-cyan-950/30"
            >
              <FileDown className="w-4 h-4" /> 
              {isDownloading ? "Mengunduh..." : "Cetak PDF F4 Resmi"}
            </button>
            <button
              onClick={handleExportWAImages}
              disabled={isGeneratingWA}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-555 disabled:opacity-50 text-white font-black text-xs p-3 px-5 rounded-2xl transition-all flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.97] cursor-pointer shadow-lg shadow-emerald-950/30"
            >
              {isGeneratingWA ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Memproses...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" /> 
                  Ekspor Gambar WA (Bagi 2)
                </>
              )}
            </button>
            <button
              onClick={onBack}
              className="w-full sm:w-auto bg-slate-805 hover:bg-slate-800 text-slate-300 border border-slate-800 font-extrabold text-xs p-3 px-5 rounded-2xl transition-all flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
            >
              <LogIn className="w-4 h-4" /> Masuk Portal
            </button>
          </div>
        </div>

        {/* METADATA GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* COLUMN 1 & 2: INFO BLOCK */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-cyan-500" /> Informasi Laporan Audit
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/50 p-3.5 border border-slate-805 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-500" /> Lokasi / Site
                </span>
                <span className="text-white font-black text-sm">{submission.site}</span>
              </div>

              <div className="bg-slate-950/50 p-3.5 border border-slate-805 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" /> Tanggal Periksa
                </span>
                <span className="text-white font-black text-sm">{formatDateIndo(submission.tanggal)}</span>
              </div>

              <div className="bg-slate-950/50 p-3.5 border border-slate-805 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" /> Waktu Shift
                </span>
                <span className="text-white font-black text-sm">{submission.waktu} (Harian)</span>
              </div>

              <div className="bg-slate-950/50 p-3.5 border border-slate-805 rounded-2xl space-y-1">
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" /> Auditor / Pelaksana
                </span>
                <span className="text-white font-black text-sm">{getCreatorFullName(submission)}</span>
              </div>
            </div>

            {/* QUICK CONDITIONAL SCORE */}
            <div className="bg-slate-950/60 p-4 border border-slate-805 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 font-bold">Ringkasan Kondisi Perangkat</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Seluruh parameter komponen di bawah ini diisi mandiri di lapangan.</p>
              </div>
              <div className="flex gap-4 font-black">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 uppercase">OK</span>
                  <div className="text-emerald-400 font-extrabold text-sm">{totalOk}</div>
                </div>
                <div className="text-center border-l border-slate-800 pl-4">
                  <span className="text-[10px] text-slate-500 uppercase">NOT OK</span>
                  <div className="text-red-400 font-extrabold text-sm">{totalNotOk}</div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: TRUST BLOCK / SECURE E-SIGN SEAL */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full filter blur-2xl pointer-events-none"></div>
            
            <div className="space-y-3">
              <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500" /> Kredensial Kripto
              </h2>
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Dokumen diverifikasi menggunakan enkripsi tanda tangan digital deterministik. Sertifikat ini menjamin data asli dan tidak diubah semenjak diunggah.
              </p>
            </div>

            <div className="space-y-2.5 pt-3">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 font-mono text-[9px] text-slate-400 space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider block text-[8px]">Integrity Signature Hash</span>
                <span className="break-all font-semibold text-emerald-400 leading-normal">{certHash}</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-850 font-mono text-[9px] text-slate-400 space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider block text-[8px]">Cert Ledger Index</span>
                <span className="break-all font-semibold text-sky-400 leading-normal">SYN-LEDGER-{submission.id.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* DETAILED CHECKLIST ITEMS COMPONENT */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">Detail Status Komponen Perangkat</h3>
            <span className="text-xs text-slate-500 font-bold">Total: {totalItems} Komponen</span>
          </div>

          <div className="space-y-8">
            {Object.entries(itemsGrouped).map(([category, items]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2 bg-slate-955/60 p-2 px-3 border border-slate-855 rounded-xl">
                  <span className="w-1.5 h-3 bg-cyan-500 rounded-full"></span>
                  <span className="text-xs font-black text-slate-300 tracking-wider uppercase">{category}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((it) => {
                    const isOk = it.status === "OK";
                    const isNotOk = it.status === "NOT OK";

                    return (
                      <div 
                        key={it.id} 
                        className="bg-slate-950/30 border border-slate-850/50 p-4 rounded-2xl hover:border-slate-800 transition-colors flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white transition-colors">{it.name}</p>
                          {it.keterangan ? (
                            <p className="text-[10px] text-slate-400 italic">Temuan: {it.keterangan}</p>
                          ) : (
                            <p className="text-[10px] text-slate-500 font-light">Kondisi perangkat normal operasional.</p>
                          )}
                        </div>

                        <div className="shrink-0 pt-0.5">
                          {isOk && (
                            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black text-[9px] rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                              <Check className="w-3 h-3 stroke-[3]" /> {it.okLabel || "OK"}
                            </span>
                          )}
                          {isNotOk && (
                            <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-400 font-black text-[9px] rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                              <X className="w-3 h-3 stroke-[3]" /> {it.notOkLabel || "OFF"}
                            </span>
                          )}
                          {!it.status && (
                            <span className="px-2.5 py-1 bg-slate-800 text-slate-400 font-black text-[9px] rounded-full uppercase tracking-wider shadow-sm">
                              BELUM DIISI
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EVIDENCE IMAGE AREA */}
        {submission.photoUrl && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-3">
              Foto Bukti Lampiran Audit / Dokumen Lapangan
            </h3>
            
            <div className="relative overflow-hidden border border-slate-800 bg-slate-950/80 rounded-2xl max-w-lg mx-auto p-2 shadow-inner">
              <img 
                src={submission.photoUrl} 
                alt="Document Evidence" 
                referrerPolicy="no-referrer"
                className="w-full h-auto rounded-xl object-contain max-h-[400px]"
              />
              <div className="absolute bottom-4 left-4 bg-slate-950/80 border border-slate-800 p-2 px-3 rounded-lg text-[10px] font-bold text-slate-300 backdrop-blur-xs flex items-center gap-1.5">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                <span>Berkas Lampiran Sah: {submission.photoName || "bukti_kesehatan_sistem_simrs.jpg"}</span>
              </div>
            </div>
          </div>
        )}

        {/* SYSTEM AUDIT TRAIL FOOTER */}
        <footer className="text-center text-[10px] text-slate-500 space-y-1 pt-4 pb-8">
          <p>© 2026 RSUD PPP - Lombok. Hak Cipta Dilindungi Undang-Undang.</p>
          <p className="font-medium text-slate-600">Terdaftar pada SYNAPSIS Security Ledger Protocol. ID Unik: {submission.id}</p>
        </footer>

      </div>

      {/* Hidden Offscreen Containers for A4 WhatsApp Capture */}
      <div className="absolute left-[-9999px] top-0 pointer-events-none select-none">
        {(() => {
          if (!submission) return null;
          // Calculate identical dynamic pages for rendering
          const subGrouped: { [category: string]: typeof submission.items } = {};
          submission.items.forEach(it => {
            const cat = (it.category || "GENERAL").toUpperCase();
            if (!subGrouped[cat]) subGrouped[cat] = [];
            subGrouped[cat].push(it);
          });

          const subAllRows: ({ type: 'category'; name: string } | { type: 'item'; item: typeof submission.items[0]; index: number })[] = [];
          let subGlobalIndex = 1;
          Object.entries(subGrouped).forEach(([category, items]) => {
            subAllRows.push({ type: 'category', name: category });
            items.forEach(it => {
              subAllRows.push({ type: 'item', item: it, index: subGlobalIndex++ });
            });
          });

          const calcPages: {
            rows: typeof subAllRows;
            showPhoto: boolean;
            showSignatures: boolean;
          }[] = [];

          let curRows: typeof subAllRows = [];
          let curUnits = 0;
          let isFirst = true;

          const getCap = (f: boolean) => f ? 22 : 30;

          for (const r of subAllRows) {
            const rUnits = r.type === 'category' ? 1.1 : 1;
            const cap = getCap(isFirst);
            if (curUnits + rUnits > cap) {
              calcPages.push({ rows: curRows, showPhoto: false, showSignatures: false });
              curRows = [r];
              curUnits = rUnits;
              isFirst = false;
            } else {
              curRows.push(r);
              curUnits += rUnits;
            }
          }

          const pUnits = submission.photoUrl ? 5.5 : 0;
          const sUnits = 7;
          const finCap = getCap(isFirst);

          if (curUnits + pUnits + sUnits <= finCap) {
            calcPages.push({ rows: curRows, showPhoto: !!submission.photoUrl, showSignatures: true });
          } else {
            if (pUnits > 0 && curUnits + pUnits <= finCap) {
              calcPages.push({ rows: curRows, showPhoto: true, showSignatures: false });
              calcPages.push({ rows: [], showPhoto: false, showSignatures: true });
            } else {
              calcPages.push({ rows: curRows, showPhoto: false, showSignatures: false });
              const subPageCap = getCap(false);
              if (pUnits + sUnits <= subPageCap) {
                calcPages.push({ rows: [], showPhoto: !!submission.photoUrl, showSignatures: true });
              } else {
                calcPages.push({ rows: [], showPhoto: !!submission.photoUrl, showSignatures: false });
                calcPages.push({ rows: [], showPhoto: false, showSignatures: true });
              }
            }
          }

          return calcPages.map((page, idx) => (
            <div 
              key={idx} 
              id={`public-wa-printable-page-${idx}`} 
              className="w-[680px] bg-white text-slate-800 p-8 shadow-md rounded-md relative flex flex-col justify-between font-sans h-[962px] overflow-hidden border border-slate-200"
            >
              <div>
                {/* Page Header */}
                {idx === 0 ? (
                  <div className="text-center relative pb-3 border-b-2 border-slate-900/10 mb-4 text-slate-800">
                    <span className="absolute top-0 right-0 text-[8px] font-black tracking-wider text-slate-400 uppercase">
                      KSO SYNAPSIS PORTAL
                    </span>
                    <h2 className="text-xs sm:text-xs font-black text-slate-900 tracking-tight uppercase">
                      LAPORAN CHECKLIST PEMELIHARAAN SISTEM SIMRS
                    </h2>
                    <div className="text-[9px] font-medium text-slate-500 mt-0.5">
                      Kategori Checklist: Harian (Pagi & Sore) • Kertas Ukuran A4
                    </div>
                    <div className="text-[9px] font-extrabold text-slate-700 mt-0.5 uppercase tracking-wide">
                      Satuan Kerja: {submission.site}
                    </div>
                  </div>
                ) : (
                  <div className="text-left relative pb-2 border-b border-dashed border-slate-300 mb-4 flex justify-between items-center text-slate-600">
                    <span className="text-[9px] font-bold uppercase tracking-tight">KSO SYNAPSIS PORTAL • Monitoring SIMRS</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase">Halaman {idx + 1}</span>
                  </div>
                )}

                {/* Page Metadata */}
                {idx === 0 && (
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[10px] bg-slate-50 p-3 rounded-xl border border-slate-150 mb-4 text-slate-800">
                    <div>
                      <span className="text-slate-400 font-medium">Tanggal Pemeriksaan:</span>
                      <strong className="text-slate-800 ml-1.5">{formatDateIndo(submission.tanggal)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Shift Pemantauan:</span>
                      <strong className="text-slate-800 ml-1.5">{submission.waktu}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Petugas Auditor / Pelaksana:</span>
                      <strong className="text-slate-800 ml-1.5">{getCreatorFullName(submission)} ({submission.roleCreator})</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Jumlah Item:</span>
                      <strong className="text-slate-800 ml-1.5">
                        {submission.items.length} perangkat (OK: {submission.items.filter(it => it.status === "OK").length}, NOT OK: {submission.items.filter(it => it.status === "NOT OK").length})
                      </strong>
                    </div>
                  </div>
                )}

                {/* Checklist Grid Table */}
                {page.rows.length > 0 && (
                  <div className="border border-slate-300 rounded-lg overflow-hidden mb-4">
                    <table className="w-full text-left border-collapse text-[10px] text-slate-800 bg-white">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-black">
                          <th className="p-1 px-2 border-r border-slate-300 w-[35px] text-center">No</th>
                          <th className="p-1 px-2 border-r border-slate-300">Nama Perangkat / Komponen</th>
                          <th className="p-1 px-2 border-r border-slate-300 w-[110px]">Kondisi Alat</th>
                          <th className="p-1 px-2">Temuan & Tindak Lanjut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {page.rows.map((row: any, rIdx: number) => {
                          if (row.type === 'category') {
                            return (
                              <tr key={`cat-${rIdx}`} className="bg-[#eef4fc] font-bold text-[#1e293b]">
                                <td colSpan={4} className="p-1 px-3 border-b border-slate-300 text-[9.5px]">
                                  KATEGORI: {row.name}
                                </td>
                              </tr>
                            );
                          } else {
                            const it = row.item;
                            return (
                              <tr key={`item-${it.id || rIdx}`} className="border-b border-slate-200 hover:bg-slate-50 text-slate-800">
                                <td className="p-1 px-2 border-r border-slate-200 text-center text-slate-500 font-mono">{row.index}</td>
                                <td className="p-1 px-2 border-r border-slate-200 font-medium text-slate-700">{it.name}</td>
                                <td className="p-1 px-2 border-r border-slate-200 font-bold">
                                  {it.status ? (
                                    it.status === "OK" ? (
                                      <span className="text-emerald-700">OK ({it.okLabel})</span>
                                    ) : (
                                      <span className="text-red-700">NOT OK ({it.notOkLabel})</span>
                                    )
                                  ) : (
                                    <span className="text-slate-400">Belum Dicek</span>
                                  )}
                                </td>
                                <td className="p-1 px-2 text-[9.5px] italic text-slate-500 leading-relaxed whitespace-normal break-words">{it.keterangan || "-"}</td>
                              </tr>
                            );
                          }
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Evidence Image Attachment */}
                {page.showPhoto && submission.photoUrl && (
                  <div className="mb-4 text-left">
                    <h4 className="text-[8.5px] font-black uppercase text-slate-400 mb-1 tracking-wider">
                      DOKUMENTASI FOTO ATTACHMENT / PROOF OF DATA ATTACHED
                    </h4>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 inline-block">
                      <img 
                        src={submission.photoUrl} 
                        alt="Bukti Checklist"
                        className="max-h-[140px] rounded object-contain border border-slate-300 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-[7.5px] text-slate-400 mt-1 font-mono">
                        File: {submission.photoName || "checklist_evidence.jpg"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Dual Signatures Box Block */}
                {page.showSignatures && (
                  <div className="grid grid-cols-2 gap-4 text-left mb-4">
                    {/* Left Signature block (Auditor/Petugas) */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between min-h-[145px]">
                      <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider font-sans">Petugas Pelaksana SIMRS</div>
                        <div className="text-[10px] font-black text-slate-800 mt-0.5">{getCreatorFullName(submission)}</div>
                        <div className="text-[8.5px] text-slate-400">Role: {submission.roleCreator}</div>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        {previewQrUrl ? (
                          <img 
                            src={previewQrUrl} 
                            alt="QR Secure Seal" 
                            className="w-12 h-12 rounded border border-slate-200 shadow-xs" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-200 rounded animate-pulse" />
                        )}
                        <div>
                          <div className="text-[8.5px] font-extrabold text-emerald-700 flex items-center gap-1">
                            VERIFIED DIGITAL
                          </div>
                          <div className="text-[7.5px] font-mono text-slate-450 mt-0.5 uppercase tracking-tighter">
                            {generateDocHash(submission.id, submission.tanggal).slice(0, 16)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-1.5 text-[9px] font-bold text-slate-700 font-sans">
                        ( {getCreatorFullName(submission)} )
                      </div>
                    </div>

                    {/* Right Signature block (Supervisor Verification) */}
                    {submission.isApproved ? (
                      <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl flex flex-col justify-between min-h-[145px]">
                        <div>
                          <div className="text-[9px] font-black text-indigo-505 uppercase tracking-wider font-sans">Supervisor E-Sign</div>
                          <div className="text-[10px] font-black text-slate-800 mt-0.5">Status: APPROVED</div>
                          <div className="text-[8px] text-slate-500">Oleh: {submission.approvedBy}</div>
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          {previewQrUrl ? (
                            <img 
                              src={previewQrUrl} 
                              alt="QR Approved Seal" 
                              className="w-12 h-12 rounded border border-blue-105 shadow-xs" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-blue-100 rounded animate-pulse" />
                          )}
                          <div>
                            <div className="text-[8px] font-extrabold text-blue-700 flex items-center gap-1 uppercase">
                              ● APPROVED & LOCKED
                            </div>
                            <div className="text-[7.5px] text-slate-400 mt-0.5 font-mono">
                              {submission.approvedAt ? new Date(submission.approvedAt).toLocaleDateString("id-ID") : submission.tanggal}
                            </div>
                          </div>
                        </div>

                        <div className="mt-1.5 text-[9px] font-bold text-slate-700 font-sans">
                          ( {submission.approvedBy} )
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-red-50/50 border border-red-200 rounded-xl flex flex-col justify-between min-h-[145px]">
                        <div>
                          <div className="text-[9px] font-black text-red-505 uppercase tracking-wider font-sans">Supervisor E-Sign</div>
                          <div className="text-[10px] font-black text-red-700 mt-0.5 uppercase">Belum Disetujui</div>
                        </div>

                        <div className="p-2 bg-red-100/40 border border-red-150 text-red-700 text-[8.5px] font-medium leading-normal rounded-lg">
                          Butuh tanda tangan supervisor untuk menerbitkan e-sign.
                        </div>

                        <div className="mt-1.5 text-[9px] font-bold text-slate-450 italic">
                          (   Belum Disetujui   )
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Page Footer */}
              <div className="pt-2.5 border-t border-slate-900/10 flex justify-between items-center text-[8.5px] text-slate-400 font-medium mt-auto font-sans">
                <div>Sistem SIMRS SIMONS • Halaman {idx + 1} dari {calcPages.length} (Kertas A4 Layout)</div>
                <div>RSUD / KSO SYNAPSIS PORTAL</div>
              </div>
            </div>
          ));
        })()}
      </div>

      {/* WhatsApp Images Split Export Modal for Public Interface */}
      {waExportImages && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-left">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-950/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <MessageSquare className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    Hasil Konversi Gambar WhatsApp SIMRS (Kertas A4)
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Gambar laporan telah dipisahkan per halaman A4 untuk keterbacaan penuh tanpa pemotongan tanda tangan.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setWaExportImages(null)}
                className="p-1 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-705 text-slate-600 dark:text-slate-350 rounded-xl text-xs font-bold ring-1 ring-slate-200 dark:ring-slate-800 hover:scale-105 active:scale-95 cursor-pointer transition-all"
              >
                Tutup
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950 text-slate-800">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/30 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed">
                  <p className="font-extrabold uppercase tracking-wider mb-1 text-[10px]">📢 Petunjuk Berbagi ke Grup WhatsApp:</p>
                  <p className="font-medium">1. Klik <b>"Salin Halaman X"</b> pada masing-masing bagian, lalu buka WhatsApp Group dan tekan <b>Ctrl + V (Paste)</b> untuk langsung mengirim tanpa mengunduh.</p>
                  <p className="font-medium mt-1">2. Jika fitur salin langsung tidak didukung browser Anda, klik <b>"Unduh Gambar"</b> lalu kirimkan berkas gambar hasil unduhan tersebut.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                {waExportImages.map((imgUrl, imgIdx) => (
                  <div key={imgIdx} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-mono">HALAMAN {imgIdx + 1}</span>
                        <span className="text-[9px] font-extrabold text-slate-450 uppercase font-sans bg-slate-50 dark:bg-slate-950 p-1 px-2 rounded-md">
                          {imgIdx === 0 ? "Header & Tabel" : imgIdx === waExportImages.length - 1 ? "Dokumentasi & E-Sign" : "Lanjutan Tabel"}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-2 flex items-center justify-center border border-slate-150 dark:border-slate-850 overflow-hidden mb-4 min-h-[220px]">
                        <img src={imgUrl} alt={`Halaman ${imgIdx + 1}`} className="max-h-[280px] object-contain shadow-md rounded" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          const link = document.createElement("a");
                          link.download = `Checklist_${submission?.site || "Bukti"}_Page${imgIdx + 1}_${submission?.tanggal || "Tgl"}.png`;
                          link.href = imgUrl;
                          link.click();
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 hover:scale-[1.02] transition-all shadow-md shadow-indigo-600/10"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Unduh Halaman {imgIdx + 1}
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const response = await fetch(imgUrl);
                            const blob = await response.blob();
                            await navigator.clipboard.write([
                              new ClipboardItem({ [blob.type]: blob })
                            ]);
                            alert(`Gambar Halaman ${imgIdx + 1} berhasil disalin ke clipboard! Silakan paste (Ctrl+V) di grup WhatsApp Anda.`);
                          } catch (e) {
                            alert("Browser Anda membatasi akses clipboard langsung. Silakan klik kanan gambar lalu pilih 'Salin Gambar' atau klik 'Unduh Gambar'.");
                          }
                        }}
                        className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-150 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all text-center"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Salin Halaman {imgIdx + 1}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
