import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Download, 
  Eye, 
  Filter, 
  CheckCircle, 
  XCircle, 
  RotateCw, 
  Loader2, 
  FileText,
  School,
  Printer,
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MarksheetTable from '@/components/MarksheetTable';
import { toast } from 'sonner';

interface ResultItem {
  enroll: string;
  seat: string;
  studentName: string;
  branch: string;
  semester: number;
  obtained: number;
  total_max: number;
  percentage: number;
  status: string;
  fetched_at: string;
  details: any;
}

export const ResultsOverview: React.FC = () => {
  const { activeCollege } = useAuth();
  const collegeId = activeCollege?.id || 1;
  const [searchParams, setSearchParams] = useSearchParams();
  const urlBranch = searchParams.get('branch') || 'all';

  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState(urlBranch);
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedResult, setSelectedResult] = useState<ResultItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [departmentList, setDepartmentList] = useState<{ id: number; name: string; code: string }[]>([]);

  // Fetch departments for the college
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await fetch(`/api/college/${collegeId}/departments`);
        if (res.ok) {
          const data = await res.json();
          setDepartmentList(data);
        }
      } catch (e) {
        console.error('Could not fetch departments:', e);
      }
    };
    fetchDepts();
  }, [collegeId]);

  // Sync url param if present
  useEffect(() => {
    if (urlBranch && urlBranch !== branchFilter) {
      setBranchFilter(urlBranch);
    }
  }, [urlBranch]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const url = new URL('/get_results', window.location.origin);
      if (collegeId) url.searchParams.append('college_id', String(collegeId));
      if (branchFilter && branchFilter !== 'all') {
        url.searchParams.append('branch', branchFilter);
      }
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (e) {
      toast.error('Could not load student results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [collegeId, branchFilter]);

  const filtered = results.filter(r => {
    const matchSearch = r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.enroll.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (r.seat && r.seat.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchSem = semesterFilter === 'all' || String(r.semester) === semesterFilter;
    const matchStatus = statusFilter === 'all' || 
                        (statusFilter === 'Pass' && r.status?.toLowerCase().includes('pass')) ||
                        (statusFilter === 'Fail' && r.status?.toLowerCase().includes('fail'));
    return matchSearch && matchSem && matchStatus;
  });

  const exportExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Student Results');

      worksheet.columns = [
        { header: 'Enrollment No', key: 'enroll', width: 16 },
        { header: 'Seat No', key: 'seat', width: 14 },
        { header: 'Student Name', key: 'name', width: 28 },
        { header: 'Branch / Course', key: 'branch', width: 28 },
        { header: 'Semester', key: 'sem', width: 10 },
        { header: 'Marks Obtained', key: 'obt', width: 16 },
        { header: 'Total Marks', key: 'total', width: 14 },
        { header: 'Percentage', key: 'pct', width: 14 },
        { header: 'Result Status', key: 'status', width: 14 },
      ];

      // Styling header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' },
      };

      filtered.forEach((r) => {
        worksheet.addRow({
          enroll: r.enroll,
          seat: r.seat || 'N/A',
          name: r.studentName,
          branch: r.branch,
          sem: r.semester,
          obt: r.obtained,
          total: r.total_max,
          pct: `${r.percentage}%`,
          status: r.status,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const collegeTag = (activeCollege?.shortName || 'MSBTE').replace(/\s+/g, '_');
      saveAs(new Blob([buffer]), `${collegeTag}_Results_Master_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel ledger generated successfully!');
    } catch (e) {
      toast.error('Failed to export Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPDF = async (result: ResultItem) => {
    try {
      // 1. Try downloading the authentic MSBTE PDF from the backend storage
      const response = await fetch(`/download_pdf/${result.enroll}`);
      if (response.ok) {
        const blob = await response.blob();
        saveAs(blob, `MSBTE_Marksheet_${result.enroll}.pdf`);
        toast.success(`Official marksheet downloaded for ${result.studentName || result.enroll}`);
        return;
      }
    } catch (e) {
      console.warn("Backend PDF download error, using print fallback:", e);
    }

    // 2. Fallback to clean print-generated PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error("Please allow popups to download/print marksheet.");
      return;
    }

    const fv = (v: any) => {
      const s = String(v || "").trim();
      return (s === "00-" || s === "0-" || s === "00" || s === "0" || s === "") ? "-" : v;
    };

    const subjects = result.details?.subjects || [];
    const subjectsHtml = subjects.length > 0
      ? subjects.map((s: any) => `
        <tr>
          <td style="border: 1px solid #333; padding: 6px 8px; text-align: left; font-weight: 500;">${s.subjectName || '-'}</td>
          <td style="border: 1px solid #333; padding: 5px; text-align: center; font-family: monospace;">${fv(s.theory?.faTh?.max)}</td>
          <td style="border: 1px solid #333; padding: 5px; text-align: center; font-family: monospace; font-weight: bold;">${fv(s.theory?.faTh?.obt)}</td>
          <td style="border: 1px solid #333; padding: 5px; text-align: center; font-family: monospace;">${fv(s.theory?.saTh?.max)}</td>
          <td style="border: 1px solid #333; padding: 5px; text-align: center; font-family: monospace; font-weight: bold;">${fv(s.theory?.saTh?.obt)}</td>
          <td style="border: 1px solid #333; padding: 5px; text-align: center; font-family: monospace;">${fv(s.theory?.total?.max)}</td>
          <td style="border: 1px solid #333; padding: 5px; text-align: center; font-family: monospace; font-weight: bold;">${fv(s.theory?.total?.obt)}</td>
          <td style="border: 1px solid #333; padding: 5px; text-align: center; font-family: monospace;">${fv(s.practicals?.faPr?.max)}</td>
          <td style="border: 1px solid #333; padding: 5px; text-align: center; font-family: monospace; font-weight: bold;">${fv(s.practicals?.faPr?.obt)}</td>
          <td style="border: 1px solid #333; padding: 5px; text-align: center; font-family: monospace;">${fv(s.practicals?.saPr?.max)}</td>
          <td style="border: 1px solid #333; padding: 5px; text-align: center; font-family: monospace; font-weight: bold;">${fv(s.practicals?.saPr?.obt)}</td>
          <td style="border: 1px solid #333; padding: 5px; text-align: center; font-family: monospace;">${fv(s.sla?.max)}</td>
          <td style="border: 1px solid #333; padding: 5px; text-align: center; font-family: monospace; font-weight: bold;">${fv(s.sla?.obt)}</td>
          <td style="border: 1px solid #333; padding: 5px; text-align: center; font-weight: bold; color: #1e40af;">${s.credits || '-'}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="14" style="text-align: center; padding: 16px; border: 1px solid #333; color: #666;">Detailed subject marks recorded in overall score</td></tr>`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Statement of Marks - ${result.enroll}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 12px; color: #111; font-size: 12px; }
            .header-box { text-align: center; border-bottom: 2px solid #222; padding-bottom: 10px; margin-bottom: 14px; }
            .header-box h1 { margin: 0; font-size: 19px; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase; }
            .header-box p { margin: 4px 0 0 0; font-size: 13px; color: #444; }
            .info-table { width: 100%; margin-bottom: 14px; border-collapse: collapse; }
            .info-table td { padding: 5px 8px; font-size: 13px; }
            .marks-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            .marks-table th, .marks-table td { border: 1px solid #333; }
            .marks-table th { background: #f3f4f6; padding: 6px 4px; text-align: center; font-weight: 600; }
            .summary-box { margin-top: 18px; border: 2px solid #222; padding: 12px; display: flex; justify-content: space-around; background: #f9fafb; border-radius: 6px; }
            .summary-item { text-align: center; }
            .summary-label { font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600; }
            .summary-val { font-size: 16px; font-weight: bold; margin-top: 3px; }
            .pass { color: #15803d; }
            .fail { color: #b91c1c; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header-box">
            <h1>MAHARASHTRA STATE BOARD OF TECHNICAL EDUCATION</h1>
            <p>OFFICIAL STATEMENT OF MARKS (DIPLOMA EXAMINATION)</p>
          </div>

          <table class="info-table">
            <tr>
              <td><strong>Student Name:</strong> ${result.studentName}</td>
              <td style="text-align: right;"><strong>Enrollment No:</strong> ${result.enroll}</td>
            </tr>
            <tr>
              <td><strong>Course / Branch:</strong> ${result.branch}</td>
              <td style="text-align: right;"><strong>Seat No:</strong> ${result.seat || '-'}</td>
            </tr>
            <tr>
              <td><strong>Semester:</strong> Semester ${result.semester}</td>
              <td style="text-align: right;"><strong>Result Status:</strong> <span class="${result.status?.toLowerCase().includes('pass') ? 'pass' : 'fail'}" style="font-weight: bold;">${result.status}</span></td>
            </tr>
          </table>

          <table class="marks-table">
            <thead>
              <tr>
                <th rowspan="2" style="text-align: left; min-width: 220px;">TITLE OF SUBJECTS</th>
                <th colspan="6">THEORY</th>
                <th colspan="4">PRACTICALS</th>
                <th colspan="2">SLA</th>
                <th rowspan="2">CREDITS</th>
              </tr>
              <tr>
                <th colspan="2">FA-TH</th>
                <th colspan="2">SA-TH</th>
                <th colspan="2">TOTAL</th>
                <th colspan="2">FA-PR</th>
                <th colspan="2">SA-PR</th>
                <th>MAX</th>
                <th>OBT</th>
              </tr>
              <tr style="background: #f9fafb; font-size: 10px;">
                <th></th>
                <th>MAX</th><th>OBT</th>
                <th>MAX</th><th>OBT</th>
                <th>MAX</th><th>OBT</th>
                <th>MAX</th><th>OBT</th>
                <th>MAX</th><th>OBT</th>
                <th>MAX</th><th>OBT</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${subjectsHtml}
            </tbody>
          </table>

          <div class="summary-box">
            <div class="summary-item">
              <div class="summary-label">Total Marks</div>
              <div class="summary-val">${result.obtained} / ${result.total_max}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Percentage</div>
              <div class="summary-val">${result.percentage}%</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">CGPA</div>
              <div class="summary-val">${(result.percentage / 9.5).toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Final Status</div>
              <div class="summary-val ${result.status?.toLowerCase().includes('pass') ? 'pass' : 'fail'}">${result.status}</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const totalPassed = filtered.filter(r => r.status?.toLowerCase().includes('pass')).length;
  const totalFailed = filtered.filter(r => r.status?.toLowerCase().includes('fail')).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">
            Student Marks & Result Registry
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Verified MSBTE marksheet records across registered departments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchResults}
            disabled={loading}
            className="h-9 sm:h-10 text-xs sm:text-sm"
          >
            <RotateCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button 
            onClick={exportExcel} 
            disabled={isExporting || filtered.length === 0}
            className="gradient-secondary text-secondary-foreground font-semibold h-9 sm:h-10 text-xs sm:text-sm shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-card p-4 rounded-2xl border border-border space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, enroll, seat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>

          {/* Branch Filter */}
          <div>
            <Select 
              value={branchFilter} 
              onValueChange={(val) => {
                setBranchFilter(val);
                setSearchParams(val === 'all' ? {} : { branch: val });
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {departmentList.map((d) => (
                  <SelectItem key={d.id} value={d.code || d.name}>
                    {d.code ? `[${d.code}] ${d.name}` : d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Semester Filter */}
          <div>
            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="All Results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Result Statuses</SelectItem>
                <SelectItem value="Pass">Pass Only</SelectItem>
                <SelectItem value="Fail">Fail / ATKT Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results summary bar */}
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
          <span>Showing <strong>{filtered.length}</strong> of <strong>{results.length}</strong> students</span>
          <div className="flex items-center gap-4 font-medium">
            <span className="text-emerald-600">Passed: {totalPassed}</span>
            <span className="text-destructive">Failed: {totalFailed}</span>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Loading verified student marks...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground space-y-3">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <p className="text-sm font-medium">No results found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                <tr>
                  <th className="py-3.5 px-4">Student Details</th>
                  <th className="py-3.5 px-4">Enrollment & Seat</th>
                  <th className="py-3.5 px-4">Branch & Sem</th>
                  <th className="py-3.5 px-4">Marks & %</th>
                  <th className="py-3.5 px-4">Result</th>
                  <th className="py-3.5 px-4 text-right">Marksheet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr key={item.enroll} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-foreground">{item.studentName}</p>
                      <p className="text-[11px] text-muted-foreground">Synced: {item.fetched_at || 'MSBTE Cache'}</p>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono">
                      <p className="font-semibold text-foreground">{item.enroll}</p>
                      <p className="text-muted-foreground">Seat: {item.seat || 'N/A'}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="text-xs font-medium text-foreground">{item.branch}</p>
                      <p className="text-[11px] text-muted-foreground">Semester {item.semester}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-foreground">{item.percentage}%</p>
                      <p className="text-xs text-muted-foreground">{item.obtained} / {item.total_max}</p>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.status?.toLowerCase().includes('pass') ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          <XCircle className="w-3.5 h-3.5" />
                          Fail / ATKT
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedResult(item)}
                          className="text-xs text-primary hover:bg-primary/10 h-8"
                          title="View Official Marksheet & Details"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(item)}
                          className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted h-8 px-2"
                          title="Download Official MSBTE PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILED OFFICIAL MARKSHEET MODAL */}
      <Dialog open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
        <DialogContent className="max-w-5xl w-[96vw] max-h-[95vh] h-[92vh] flex flex-col p-4 sm:p-5 overflow-hidden">
          <DialogHeader className="pb-2 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
              <div>
                <DialogTitle className="text-lg sm:text-xl font-heading font-bold flex items-center gap-2">
                  <span>Official MSBTE Statement of Marks</span>
                  {selectedResult && (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      selectedResult.status?.toLowerCase().includes('pass')
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {selectedResult.status}
                    </span>
                  )}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedResult?.studentName} • Enroll: <span className="font-mono font-medium">{selectedResult?.enroll}</span> • Seat: <span className="font-mono font-medium">{selectedResult?.seat || 'N/A'}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => selectedResult && window.open(`/view_pdf/${selectedResult.enroll}`, '_blank')}
                  className="text-xs h-8 sm:h-9"
                  title="Open full authentic MSBTE PDF in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Open Full PDF
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => selectedResult && handleDownloadPDF(selectedResult)}
                  className="gradient-primary text-primary-foreground font-semibold text-xs h-8 sm:h-9"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download PDF Copy
                </Button>
              </div>
            </div>
          </DialogHeader>

          {selectedResult && (
            <Tabs defaultValue="official" className="flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-2 max-w-xs mb-2">
                <TabsTrigger value="official" className="text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Official Marksheet
                </TabsTrigger>
                <TabsTrigger value="breakdown" className="text-xs flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Subject Breakdown
                </TabsTrigger>
              </TabsList>

              <TabsContent value="official" className="flex-1 min-h-0 mt-0">
                <div className="w-full h-full rounded-xl overflow-hidden border border-border bg-muted/10 relative shadow-inner">
                  <iframe
                    src={`/view_pdf/${selectedResult.enroll}#toolbar=1`}
                    className="w-full h-full border-0"
                    title={`MSBTE Official Marksheet - ${selectedResult.enroll}`}
                  />
                </div>
              </TabsContent>

              <TabsContent value="breakdown" className="flex-1 overflow-y-auto pr-1 space-y-4 mt-0">
                {/* Marksheet Header */}
                <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <h3 className="font-heading font-bold text-base text-foreground">
                      {activeCollege?.name || 'SOMAYYA POLYTECHNIC, CHANDRAPUR'}
                    </h3>
                    <p className="text-xs text-muted-foreground">MSBTE Code: {activeCollege?.msbteCode || '1234'} • Academic Session</p>
                    <p className="text-sm font-semibold text-foreground mt-2">
                      Student: {selectedResult.studentName}
                    </p>
                  </div>
                  <div className="text-left sm:text-right text-xs space-y-1">
                    <p><strong>Enrollment:</strong> {selectedResult.enroll}</p>
                    <p><strong>Seat No:</strong> {selectedResult.seat || '-'}</p>
                    <p><strong>Branch:</strong> {selectedResult.branch}</p>
                    <p><strong>Semester:</strong> Semester {selectedResult.semester}</p>
                  </div>
                </div>

                {/* Subject Breakup Table */}
                <div className="border border-border rounded-lg overflow-hidden shadow-sm">
                  {selectedResult.details?.subjects && selectedResult.details.subjects.length > 0 ? (
                    <MarksheetTable subjects={selectedResult.details.subjects} />
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      Detailed subject breakdown cached. Overall Marks: {selectedResult.obtained} / {selectedResult.total_max} ({selectedResult.percentage}%).
                    </p>
                  )}
                </div>

                {/* Marksheet Footer Summary */}
                <div className="p-4 rounded-xl bg-card border border-border flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Final Result</p>
                    <p className={`text-lg font-bold font-heading ${
                      selectedResult.status?.toLowerCase().includes('pass') ? 'text-emerald-600' : 'text-destructive'
                    }`}>
                      {selectedResult.status}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Total Obtained</p>
                    <p className="text-lg font-bold font-heading text-foreground">
                      {selectedResult.obtained} / {selectedResult.total_max}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Percentage</p>
                    <p className="text-lg font-bold font-heading text-primary">
                      {selectedResult.percentage}%
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">CGPA</p>
                    <p className="text-lg font-bold font-heading text-foreground">
                      {(selectedResult.percentage / 9.5).toFixed(2)}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResultsOverview;