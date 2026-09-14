import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useAuth } from '@/contexts/AuthContext';
import { BRANCHES, SEMESTERS } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Download, 
  Eye, 
  Filter,
  CheckCircle,
  XCircle,
  Loader2,
  Printer,
  FileText,
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import MarksheetTable from '@/components/MarksheetTable';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Result {
  enroll: string;
  seat: string;
  studentName: string;
  branch: string;
  semester: number;
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  cgpa: number;
  result: 'Pass' | 'Fail';
  details: any;
}

const TeacherResults: React.FC = () => {
  const { user, activeCollege } = useAuth();
  const collegeId = activeCollege?.id || 1;
  const initialBranch = (user?.branch && user.role !== 'college_admin') ? user.branch : 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>(initialBranch);
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [dbResults, setDbResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFromDB = async () => {
      setIsLoading(true);
      try {
        const url = new URL("/get_results", window.location.origin);
        if (collegeId) url.searchParams.append("college_id", String(collegeId));
        if (branchFilter && branchFilter !== 'all') {
          url.searchParams.append("branch", branchFilter);
        }
        const response = await fetch(url.toString());
        const data = await response.json();
        
        const formattedData: Result[] = Array.isArray(data) ? data.map((item: any) => {
          return {
            enroll: item.enroll,
            seat: item.seat,
            studentName: item.studentName || "Unknown",
            branch: item.branch || "N/A",
            semester: item.semester || item.details?.semester || 6,
            obtainedMarks: item.obtained || 0,
            totalMarks: item.total_max || 0,
            percentage: item.percentage || 0,
            cgpa: item.details?.cgpa || 0,
            result: item.status === 'Pass' ? 'Pass' : 'Fail', 
            details: item.details
          };
        }) : [];
        
        setDbResults(formattedData);
      } catch (error) {
        console.error("Failed to fetch results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFromDB();
  }, [collegeId, branchFilter]);

  const filteredResults = dbResults.filter((result) => {
    const matchesSearch =
      result.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.enroll.includes(searchTerm);

    // Simplified branch mapping logic (matches display name to DB name)
    let dbBranchTarget = branchFilter;
    if (branchFilter === 'Electronics Engineering') {
      dbBranchTarget = 'Electronics & Tele-Communication Engineering';
    } else if (branchFilter === 'Mining') {
      dbBranchTarget = 'Mining & Mine Surveying';
    }

    const matchesBranch = 
      branchFilter === 'all' || 
      result.branch.toLowerCase().trim() === dbBranchTarget.toLowerCase().trim() ||
      result.branch.toLowerCase().trim() === branchFilter.toLowerCase().trim();

    const matchesSemester = 
      semesterFilter === 'all' || 
      result.semester === parseInt(semesterFilter);

    return matchesSearch && matchesBranch && matchesSemester;
  });

  const exportToExcel = async () => {
    if (filteredResults.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Student Results');

    worksheet.columns = [
      { header: 'Enrollment No', key: 'enroll', width: 20 },
      { header: 'Seat No', key: 'seat', width: 15 },
      { header: 'Student Name', key: 'name', width: 35 },
      { header: 'Branch', key: 'branch', width: 40 },
      { header: 'Semester', key: 'sem', width: 12 },
      { header: 'Obtained', key: 'obtained', width: 12 },
      { header: 'Total', key: 'total', width: 12 },
      { header: 'Percentage', key: 'percent', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    filteredResults.forEach(r => {
      worksheet.addRow({
        enroll: r.enroll,
        seat: r.seat,
        name: r.studentName,
        branch: r.branch,
        sem: r.semester,
        obtained: r.obtainedMarks,
        total: r.totalMarks,
        percent: `${r.percentage}%`,
        status: r.result,
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4F46E5' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.height = 22;
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'E5E7EB' } },
            left: { style: 'thin', color: { argb: 'E5E7EB' } },
            bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
            right: { style: 'thin', color: { argb: 'E5E7EB' } }
          };

          if (cell.value === 'Pass') {
            cell.font = { color: { argb: '10B981' }, bold: true };
          } else if (cell.value === 'Fail') {
            cell.font = { color: { argb: 'EF4444' }, bold: true };
          }
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Dynamic Filename based on the selected branch
    const branchName = branchFilter === 'all' ? 'All_Branches' : branchFilter.replace(/\s+/g, '_');
    const fileName = `${branchName}_Results.xlsx`;
    
    saveAs(blob, fileName);
  };

  const handleDownloadPDF = async (result: Result) => {
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

    // 2. Fallback to print-generated PDF
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

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
              <td style="text-align: right;"><strong>Result Status:</strong> <span class="${result.result === 'Pass' ? 'pass' : 'fail'}" style="font-weight: bold;">${result.result}</span></td>
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
              <div class="summary-val">${result.obtainedMarks} / ${result.totalMarks}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Percentage</div>
              <div class="summary-val">${result.percentage}%</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">CGPA</div>
              <div class="summary-val">${result.cgpa || (result.percentage / 9.5).toFixed(2)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Final Status</div>
              <div class="summary-val ${result.result === 'Pass' ? 'pass' : 'fail'}">${result.result}</div>
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Student Results</h1>
          <p className="text-muted-foreground mt-1">Manage and view all student performance records from Database</p>
        </div>
        <Button variant="outline" onClick={exportToExcel} disabled={filteredResults.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export All (Excel)
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search enrollment or name..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {BRANCHES.map(branch => (
              <SelectItem key={branch} value={branch}>
                {branch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={semesterFilter} onValueChange={setSemesterFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {SEMESTERS.map(sem => (
              <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" className="justify-start" onClick={() => {
          setSearchTerm('');
          setBranchFilter('all');
          setSemesterFilter('all');
        }}>
          <Filter className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-card">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Reading Database...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrollment</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredResults.length > 0 ? (
                filteredResults.map((result) => (
                  <TableRow key={result.enroll} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-sm">{result.enroll}</TableCell>
                    <TableCell className="font-medium">{result.studentName}</TableCell>
                    <TableCell>{result.branch}</TableCell>
                    <TableCell>{result.semester}</TableCell>
                    <TableCell className="font-semibold">{result.percentage}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {result.result === 'Pass' ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-success" />
                            <span className="text-success font-medium">Pass</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-destructive" />
                            <span className="text-destructive font-medium">Fail</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedResult(result)}
                          className="text-xs text-primary hover:bg-primary/10 h-8"
                          title="View Official Marksheet & Details"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPDF(result)}
                          className="text-xs text-muted-foreground hover:text-foreground hover:bg-muted h-8 px-2"
                          title="Download Official MSBTE PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No results found in the database.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Full Marksheet Modal with exact MSBTE Marksheet View & Download PDF */}
      <Dialog open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
        <DialogContent className="max-w-5xl w-[96vw] max-h-[95vh] h-[92vh] flex flex-col p-4 sm:p-5 overflow-hidden">
          <DialogHeader className="pb-2 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
              <div>
                <DialogTitle className="text-lg sm:text-xl font-heading font-bold flex items-center gap-2">
                  <span>Official MSBTE Statement of Marks</span>
                  {selectedResult && (
                    <span className={cn('text-xs px-2.5 py-0.5 rounded-full font-semibold', 
                      selectedResult.result === 'Pass' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    )}>
                      {selectedResult.result}
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
                  title="Open authentic MSBTE PDF in a new tab"
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

              <TabsContent value="breakdown" className="flex-1 overflow-y-auto pr-1 space-y-3 mt-0">
                {/* Header Info */}
                <div className="bg-muted/30 p-3 rounded-lg border border-border">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 text-xs">
                    <div className="col-span-2">
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold">Student Name</p>
                      <p className="font-bold text-sm text-foreground truncate mt-0.5">{selectedResult.studentName}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold">Enrollment</p>
                      <p className="font-mono font-bold text-xs text-foreground mt-0.5">{selectedResult.enroll}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold">Seat No</p>
                      <p className="font-mono font-bold text-xs text-foreground mt-0.5">{selectedResult.seat || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold">Semester</p>
                      <p className="font-bold text-xs text-foreground mt-0.5">Sem {selectedResult.semester}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase font-semibold">Status</p>
                      <p className={cn('font-bold text-xs mt-0.5', selectedResult.result === 'Pass' ? 'text-success' : 'text-destructive')}>
                        {selectedResult.result}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Marksheet Subject Table */}
                <div className="border border-border rounded-lg overflow-hidden shadow-sm">
                  {selectedResult.details?.subjects && selectedResult.details.subjects.length > 0 ? (
                    <MarksheetTable subjects={selectedResult.details.subjects} />
                  ) : (
                    <div className="py-6 text-center text-muted-foreground text-xs">
                      <p>Marksheet overview recorded: {selectedResult.obtainedMarks} / {selectedResult.totalMarks} ({selectedResult.percentage}%)</p>
                    </div>
                  )}
                </div>

                {/* Summary Box */}
                <div className="grid grid-cols-4 gap-2.5 p-2.5 bg-muted/20 rounded-lg border border-border text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Marks</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{selectedResult.obtainedMarks}/{selectedResult.totalMarks}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Percentage</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{selectedResult.percentage}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">CGPA</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{selectedResult.cgpa || (selectedResult.percentage / 9.5).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Result</p>
                    <p className={cn('text-sm font-bold mt-0.5', selectedResult.result === 'Pass' ? 'text-success' : 'text-destructive')}>
                      {selectedResult.result}
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

export default TeacherResults;