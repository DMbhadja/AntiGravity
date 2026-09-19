import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { EmployeeService } from './services/employee.service';
import { DepartmentService } from './services/department.service';
import { ToastService } from './services/toast.service';
import { Employee, EmployeeRequest, EmployeeStatus } from './models/employee.model';
import { Department } from './models/department.model';
import { DashboardStats } from './models/stats.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  // Navigation & View State
  activeTab: 'directory' | 'departments' | 'analytics' = 'directory';
  viewMode: 'table' | 'grid' = 'table';
  isLoading = false;
  isBackendConnected = true;

  // Data
  employees: Employee[] = [];
  departments: Department[] = [];
  stats: DashboardStats = {
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    onLeaveEmployees: 0,
    totalDepartments: 0,
    averageSalary: 0,
    departmentDistribution: {},
    statusDistribution: {}
  };

  // Filter & Search Controls
  searchQuery = '';
  selectedDepartmentId: number | null = null;
  selectedStatus: string = 'ALL';
  sortBy: 'name' | 'salary' | 'hireDate' | 'id' = 'id';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Reactive Search Pipeline
  private searchSubject$ = new Subject<string>();
  private searchSub?: Subscription;

  // Modal States
  isEmployeeModalOpen = false;
  isDepartmentModalOpen = false;
  isDeleteEmployeeModalOpen = false;
  isDeleteDeptModalOpen = false;
  isEditing = false;
  editingEmployeeId: number | null = null;

  employeeToDelete: Employee | null = null;
  departmentToDelete: Department | null = null;

  // Forms
  employeeForm: FormGroup;
  departmentForm: FormGroup;

  // Avatar Presets for Quick Selection
  avatarPresets: string[] = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  ];

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    public toastService: ToastService
  ) {
    this.employeeForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      jobTitle: ['', [Validators.required]],
      salary: [75000, [Validators.required, Validators.min(1)]],
      hireDate: [new Date().toISOString().substring(0, 10), [Validators.required]],
      status: ['ACTIVE', [Validators.required]],
      departmentId: [null, [Validators.required]],
      avatarUrl: [this.avatarPresets[0]]
    });

    this.departmentForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.maxLength(20)]],
      description: ['']
    });
  }

  ngOnInit(): void {
    // Ultra-responsive debounced search
    this.searchSub = this.searchSubject$.pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe(() => {
      this.loadEmployees();
    });

    this.loadAllData();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  onSearchInput(query: string): void {
    this.searchSubject$.next(query);
  }

  loadAllData(): void {
    this.isLoading = true;
    this.loadDepartments();
    this.loadEmployees();
    this.loadStats();
  }

  loadDepartments(forceRefresh = false): void {
    this.departmentService.getDepartments().subscribe({
      next: (depts) => {
        this.departments = depts;
        this.isBackendConnected = true;
      },
      error: (err) => {
        console.error('Failed to load departments', err);
        this.isBackendConnected = false;
      }
    });
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.employeeService.getEmployees(this.searchQuery, this.selectedDepartmentId, this.selectedStatus).subscribe({
      next: (data) => {
        this.employees = data;
        this.applyLocalSort();
        this.isLoading = false;
        this.isBackendConnected = true;
      },
      error: (err) => {
        this.isLoading = false;
        this.isBackendConnected = false;
        this.toastService.error('Fetch Error', 'Failed to load employees from MySQL database.');
      }
    });
  }

  loadStats(): void {
    this.employeeService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (err) => {
        console.error('Stats error', err);
      }
    });
  }

  onFilterChange(): void {
    this.loadEmployees();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedDepartmentId = null;
    this.selectedStatus = 'ALL';
    this.loadEmployees();
  }

  setSort(field: 'name' | 'salary' | 'hireDate' | 'id'): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.applyLocalSort();
  }

  applyLocalSort(): void {
    this.employees.sort((a, b) => {
      let comparison = 0;
      if (this.sortBy === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (this.sortBy === 'salary') {
        comparison = a.salary - b.salary;
      } else if (this.sortBy === 'hireDate') {
        comparison = new Date(a.hireDate).getTime() - new Date(b.hireDate).getTime();
      } else {
        comparison = (a.id || 0) - (b.id || 0);
      }
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  // Employee CRUD Modals
  openAddEmployeeModal(): void {
    this.isEditing = false;
    this.editingEmployeeId = null;
    this.employeeForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      salary: 75000,
      hireDate: new Date().toISOString().substring(0, 10),
      status: 'ACTIVE',
      departmentId: this.departments.length > 0 ? this.departments[0].id : null,
      avatarUrl: this.avatarPresets[Math.floor(Math.random() * this.avatarPresets.length)]
    });
    this.isEmployeeModalOpen = true;
  }

  openEditEmployeeModal(emp: Employee): void {
    this.isEditing = true;
    this.editingEmployeeId = emp.id || null;
    this.employeeForm.patchValue({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || '',
      jobTitle: emp.jobTitle,
      salary: emp.salary,
      hireDate: emp.hireDate,
      status: emp.status,
      departmentId: emp.department ? emp.department.id : null,
      avatarUrl: emp.avatarUrl || this.avatarPresets[0]
    });
    this.isEmployeeModalOpen = true;
  }

  closeEmployeeModal(): void {
    this.isEmployeeModalOpen = false;
  }

  selectAvatar(url: string): void {
    this.employeeForm.patchValue({ avatarUrl: url });
  }

  saveEmployee(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      this.toastService.error('Form Invalid', 'Please correct the highlighted errors.');
      return;
    }

    const formVal = this.employeeForm.value;
    const empData: EmployeeRequest = {
      firstName: formVal.firstName,
      lastName: formVal.lastName,
      email: formVal.email,
      phone: formVal.phone,
      jobTitle: formVal.jobTitle,
      salary: Number(formVal.salary),
      hireDate: formVal.hireDate,
      status: formVal.status,
      departmentId: Number(formVal.departmentId),
      avatarUrl: formVal.avatarUrl
    };

    if (this.isEditing && this.editingEmployeeId) {
      this.employeeService.updateEmployee(this.editingEmployeeId, empData).subscribe({
        next: () => {
          this.toastService.success('Employee Updated', `${empData.firstName} ${empData.lastName} has been successfully updated.`);
          this.closeEmployeeModal();
          this.loadAllData();
        },
        error: (err) => {
          const msg = err.error?.message || 'Failed to update employee';
          this.toastService.error('Update Failed', msg);
        }
      });
    } else {
      this.employeeService.createEmployee(empData).subscribe({
        next: () => {
          this.toastService.success('Employee Added', `${empData.firstName} ${empData.lastName} has been added successfully.`);
          this.closeEmployeeModal();
          this.loadAllData();
        },
        error: (err) => {
          const msg = err.error?.message || 'Failed to create employee';
          this.toastService.error('Creation Failed', msg);
        }
      });
    }
  }

  // Delete Employee Confirmation
  openDeleteEmployeeModal(emp: Employee): void {
    this.employeeToDelete = emp;
    this.isDeleteEmployeeModalOpen = true;
  }

  closeDeleteEmployeeModal(): void {
    this.isDeleteEmployeeModalOpen = false;
    this.employeeToDelete = null;
  }

  confirmDeleteEmployee(): void {
    if (!this.employeeToDelete || !this.employeeToDelete.id) return;
    const empName = `${this.employeeToDelete.firstName} ${this.employeeToDelete.lastName}`;
    
    this.employeeService.deleteEmployee(this.employeeToDelete.id).subscribe({
      next: () => {
        this.toastService.success('Employee Deleted', `${empName} was removed from the system.`);
        this.closeDeleteEmployeeModal();
        this.loadAllData();
      },
      error: (err) => {
        const msg = err.error?.message || 'Could not delete employee';
        this.toastService.error('Delete Failed', msg);
      }
    });
  }

  // Department Modal
  openDepartmentModal(): void {
    this.departmentForm.reset({
      name: '',
      code: '',
      description: ''
    });
    this.isDepartmentModalOpen = true;
  }

  closeDepartmentModal(): void {
    this.isDepartmentModalOpen = false;
  }

  saveDepartment(): void {
    if (this.departmentForm.invalid) {
      this.departmentForm.markAllAsTouched();
      return;
    }

    const val = this.departmentForm.value;
    this.departmentService.createDepartment(val).subscribe({
      next: (created) => {
        this.toastService.success('Department Created', `Department "${created.name}" created successfully.`);
        this.closeDepartmentModal();
        this.loadDepartments();
        this.loadStats();
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to create department';
        this.toastService.error('Creation Failed', msg);
      }
    });
  }

  openDeleteDeptModal(dept: Department): void {
    this.departmentToDelete = dept;
    this.isDeleteDeptModalOpen = true;
  }

  closeDeleteDeptModal(): void {
    this.isDeleteDeptModalOpen = false;
    this.departmentToDelete = null;
  }

  confirmDeleteDepartment(): void {
    if (!this.departmentToDelete || !this.departmentToDelete.id) return;
    const name = this.departmentToDelete.name;

    this.departmentService.deleteDepartment(this.departmentToDelete.id).subscribe({
      next: () => {
        this.toastService.success('Department Removed', `Department "${name}" was deleted.`);
        this.closeDeleteDeptModal();
        this.loadDepartments();
        this.loadStats();
      },
      error: (err) => {
        const msg = err.error?.message || 'Could not delete department';
        this.toastService.error('Deletion Blocked', msg);
      }
    });
  }

  // Department Badge Colors
  getDepartmentColor(deptName: string): { bg: string; text: string; border: string } {
    switch (deptName) {
      case 'Engineering':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
      case 'Human Resources':
        return { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6', border: 'rgba(236, 72, 153, 0.3)' };
      case 'Product & Design':
        return { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
      case 'Finance & Operations':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
      case 'Marketing & Sales':
        return { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' };
      default:
        return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.3)' };
    }
  }

  // Export to CSV
  exportToCsv(): void {
    if (this.employees.length === 0) {
      this.toastService.info('Export Notice', 'No employees available to export.');
      return;
    }

    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Job Title', 'Department', 'Salary', 'Hire Date', 'Status'];
    const rows = this.employees.map(e => [
      e.id,
      `"${e.firstName}"`,
      `"${e.lastName}"`,
      `"${e.email}"`,
      `"${e.phone || ''}"`,
      `"${e.jobTitle}"`,
      `"${e.department?.name || ''}"`,
      e.salary,
      e.hireDate,
      e.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employees_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toastService.success('Export Successful', `Exported ${this.employees.length} employees to CSV.`);
  }

  getDepartmentDistributionList(): { name: string; count: number; percentage: number }[] {
    if (!this.stats.departmentDistribution || this.stats.totalEmployees === 0) return [];
    return Object.entries(this.stats.departmentDistribution).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / this.stats.totalEmployees) * 100)
    }));
  }
}
