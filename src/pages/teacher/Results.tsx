import React, { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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
  Loader2
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [dbResults, setDbResults] = useState<Result[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFromDB = async () => {
      try {
        const response = await fetch("http://127.0.0.1:5000/get_results");
        const data = await response.json();
        
        const formattedData: Result[] = data.map((item: any) => {
          return {
            enroll: item.enroll,
            seat: item.seat,
            studentName: item.studentName || "Unknown",
            branch: item.branch || "N/A",
            semester: item.details?.semester || 4,
            obtainedMarks: item.obtained || 0,
            totalMarks: item.total_max || 0,
            percentage: item.percentage || 0,
            cgpa: item.details?.cgpa || 0,
            result: item.status === 'Pass' ? 'Pass' : 'Fail', 
            details: item.details
          };
        });
        
        setDbResults(formattedData);
      } catch (error) {
        console.error("Failed to fetch results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFromDB();
  }, []);

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
            {/* CLEANED UP SELECTOR */}
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
                      <Button variant="ghost" size="sm" onClick={() => setSelectedResult(result)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
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

      <Dialog open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Full Academic Result</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Student Name</p>
                  <p className="font-bold text-lg">{selectedResult.studentName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Enrollment Number</p>
                  <p className="font-mono font-bold text-lg">{selectedResult.enroll}</p>
                </div>
              </div>
              
              <div className="flex justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Marks</p>
                  <p className="text-xl font-bold">{selectedResult.obtainedMarks}/{selectedResult.totalMarks}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Percentage</p>
                  <p className="text-xl font-bold">{selectedResult.percentage}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Result</p>
                  <p className={cn('text-xl font-bold', selectedResult.result === 'Pass' ? 'text-success' : 'text-destructive')}>
                    {selectedResult.result}
                  </p>
                </div>
              </div>

              <Button className="w-full" variant="secondary">
                <Download className="w-4 h-4 mr-2" />
                Download PDF Copy
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherResults;