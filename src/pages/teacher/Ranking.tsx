import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BRANCHES, SEMESTERS } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Trophy,
  Medal,
  Award,
  Filter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface RankingData {
  enrollmentNumber: string;
  studentName: string;
  branch: string;
  semester: number;
  percentage: number;
  cgpa: string;
  displayRank: number; 
}

const TeacherRanking: React.FC = () => {
  const { user, activeCollege } = useAuth();
  const collegeId = activeCollege?.id || 1;
  const initialBranch = (user?.branch && user.role !== 'college_admin') ? user.branch : 'all';

  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>(initialBranch);
  const [semesterFilter, setSemesterFilter] = useState<string>('all');
  const [dbRankings, setDbRankings] = useState<RankingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      setIsLoading(true);
      try {
        const url = new URL("/get_results", window.location.origin);
        if (collegeId) url.searchParams.append("college_id", String(collegeId));
        if (branchFilter && branchFilter !== 'all') {
          url.searchParams.append("branch", branchFilter);
        }
        const response = await fetch(url.toString());
        const data = await response.json();
        
        const formatted = Array.isArray(data) ? data.map((item: any) => ({
          enrollmentNumber: item.enroll,
          studentName: item.studentName,
          branch: item.branch,
          semester: item.semester || item.details?.semester || 6, 
          percentage: item.percentage,
          cgpa: (item.percentage / 9.5).toFixed(2),
        })) : [];

        const sortedWithPermanentRank = formatted
          .sort((a: any, b: any) => (b.percentage || 0) - (a.percentage || 0))
          .map((student: any, index: number) => ({
            ...student,
            displayRank: index + 1 
          }));
        
        setDbRankings(sortedWithPermanentRank);
      } catch (error) {
        console.error("Error fetching rankings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRankings();
  }, [collegeId, branchFilter]);

  const filteredRankings = dbRankings.filter((ranking) => {
    const matchesSearch =
      ranking.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ranking.enrollmentNumber.includes(searchTerm);
    
    let targetBranch = branchFilter;
    if (branchFilter === 'Electronics Engineering') {
      targetBranch = 'Electronics & Tele-Communication Engineering';
    } else if (branchFilter === 'Mining Engineering') {
      targetBranch = 'Mining & Mine Surveying';
    }

    const matchesBranch = 
      branchFilter === 'all' || 
      ranking.branch.toLowerCase().trim() === targetBranch.toLowerCase().trim();
      
    const matchesSemester = semesterFilter === 'all' || ranking.semester === parseInt(semesterFilter);
    return matchesSearch && matchesBranch && matchesSemester;
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200';
    if (rank === 3) return 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200';
    return '';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Rankings</h1>
        <p className="text-muted-foreground mt-1">Top performers of the semester</p>
      </div>

      {/* TOPPERS SECTION: Only shows if a specific branch is selected */}
      {!isLoading && branchFilter !== 'all' && filteredRankings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredRankings.slice(0, 3).map((student, index) => (
            <div
              key={student.enrollmentNumber}
              className={cn(
                'relative overflow-hidden rounded-xl p-6 border-2 transition-all hover:scale-[1.02]',
                index === 0 && 'bg-gradient-to-br from-yellow-50 via-yellow-100 to-amber-50 border-yellow-300',
                index === 1 && 'bg-gradient-to-br from-gray-50 via-gray-100 to-slate-50 border-gray-300',
                index === 2 && 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border-amber-300'
              )}
            >
              <div
                className={cn(
                  'absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl',
                  index === 0 && 'bg-yellow-500 text-white',
                  index === 1 && 'bg-gray-400 text-white',
                  index === 2 && 'bg-amber-600 text-white'
                )}
              >
                {index + 1}
              </div>

              <div className="flex items-center gap-3 mb-4">
                {getRankIcon(index + 1)}
                <span className="text-sm font-medium text-muted-foreground">
                  {index === 0 ? '1st Place' : index === 1 ? '2nd Place' : '3rd Place'}
                </span>
              </div>

              <h3 className="text-xl font-heading font-bold text-foreground mb-1">
                {student.studentName}
              </h3>
              <p className="text-sm text-muted-foreground mb-1">{student.branch}</p>
              <p className="text-xs text-muted-foreground mb-4">Semester {student.semester}</p>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">{student.percentage}%</p>
                  <p className="text-xs text-muted-foreground">Percentage</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{student.cgpa}</p>
                  <p className="text-xs text-muted-foreground">CGPA</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or enrollment number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {BRANCHES.map((branch) => (
              <SelectItem key={branch} value={branch}>{branch}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={semesterFilter} onValueChange={setSemesterFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {SEMESTERS.map((sem) => (
              <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Full Rankings Table */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-20">Rank</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Enrollment No.</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Percentage</TableHead>
              <TableHead>CGPA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Fetching database results...</p>
                  </TableCell>
                </TableRow>
            ) : filteredRankings.length > 0 ? (
              filteredRankings.map((student, idx) => (
                <TableRow
                  key={student.enrollmentNumber}
                  className={cn('transition-colors', getRankStyle(branchFilter === 'all' ? student.displayRank : idx + 1))}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRankIcon(branchFilter === 'all' ? student.displayRank : idx + 1)}
                      <span className="font-bold">{branchFilter === 'all' ? student.displayRank : idx + 1}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{student.studentName}</TableCell>
                  <TableCell className="font-mono text-sm">{student.enrollmentNumber}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{student.branch}</TableCell>
                  <TableCell>{student.semester}</TableCell>
                  <TableCell><span className="font-semibold">{student.percentage}%</span></TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                      {student.cgpa}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No rankings found in database for the selected criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TeacherRanking;