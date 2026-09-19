package com.ems.backend.service;

import com.ems.backend.dto.DashboardStats;
import com.ems.backend.dto.EmployeeRequest;
import com.ems.backend.exception.BadRequestException;
import com.ems.backend.exception.ResourceNotFoundException;
import com.ems.backend.model.Department;
import com.ems.backend.model.Employee;
import com.ems.backend.repository.DepartmentRepository;
import com.ems.backend.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;

    public EmployeeService(EmployeeRepository employeeRepository, DepartmentRepository departmentRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    public List<Employee> getAllEmployees(String search, Long departmentId, String status) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) ? status.trim().toUpperCase() : null;
        return employeeRepository.searchEmployees(cleanSearch, departmentId, cleanStatus);
    }

    @Transactional(readOnly = true)
    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    public Employee createEmployee(EmployeeRequest request) {
        if (employeeRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new BadRequestException("Employee email already exists: " + request.getEmail());
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));

        Employee employee = new Employee();
        employee.setFirstName(request.getFirstName().trim());
        employee.setLastName(request.getLastName().trim());
        employee.setEmail(request.getEmail().trim().toLowerCase());
        employee.setPhone(request.getPhone());
        employee.setJobTitle(request.getJobTitle().trim());
        employee.setSalary(request.getSalary());
        employee.setHireDate(request.getHireDate());
        employee.setStatus(request.getStatus() != null && !request.getStatus().isBlank() ? request.getStatus().toUpperCase() : "ACTIVE");
        employee.setDepartment(department);
        employee.setAvatarUrl(request.getAvatarUrl());

        return employeeRepository.save(employee);
    }

    public Employee updateEmployee(Long id, EmployeeRequest request) {
        Employee employee = getEmployeeById(id);

        String email = request.getEmail().trim().toLowerCase();
        if (employeeRepository.existsByEmailAndIdNot(email, id)) {
            throw new BadRequestException("Employee email already in use by another employee: " + request.getEmail());
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));

        employee.setFirstName(request.getFirstName().trim());
        employee.setLastName(request.getLastName().trim());
        employee.setEmail(email);
        employee.setPhone(request.getPhone());
        employee.setJobTitle(request.getJobTitle().trim());
        employee.setSalary(request.getSalary());
        employee.setHireDate(request.getHireDate());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            employee.setStatus(request.getStatus().toUpperCase());
        }
        employee.setDepartment(department);
        employee.setAvatarUrl(request.getAvatarUrl());

        return employeeRepository.save(employee);
    }

    public void deleteEmployee(Long id) {
        Employee employee = getEmployeeById(id);
        employeeRepository.delete(employee);
    }

    @Transactional(readOnly = true)
    public DashboardStats getDashboardStats() {
        Object[] countAndAvg = employeeRepository.getEmployeeCountAndAvgSalary();
        long totalEmployees = 0;
        double averageSalary = 0.0;
        if (countAndAvg != null && countAndAvg.length > 0) {
            Object[] row = countAndAvg[0] instanceof Object[] ? (Object[]) countAndAvg[0] : countAndAvg;
            if (row[0] != null) totalEmployees = ((Number) row[0]).longValue();
            if (row.length > 1 && row[1] != null) averageSalary = Math.round(((Number) row[1]).doubleValue() * 100.0) / 100.0;
        }

        List<com.ems.backend.dto.DepartmentResponse> depts = departmentRepository.findAllWithEmployeeCount();
        Map<String, Long> departmentDistribution = new HashMap<>();
        for (var dept : depts) {
            departmentDistribution.put(dept.getName(), dept.getEmployeeCount());
        }

        Map<String, Long> statusDistribution = new HashMap<>();
        statusDistribution.put("ACTIVE", 0L);
        statusDistribution.put("INACTIVE", 0L);
        statusDistribution.put("ON_LEAVE", 0L);
        List<Object[]> statusCounts = employeeRepository.countEmployeesByStatusGroup();
        for (Object[] statusRow : statusCounts) {
            if (statusRow[0] != null && statusRow[1] != null) {
                statusDistribution.put(statusRow[0].toString(), ((Number) statusRow[1]).longValue());
            }
        }

        long activeEmployees = statusDistribution.getOrDefault("ACTIVE", 0L);
        long inactiveEmployees = statusDistribution.getOrDefault("INACTIVE", 0L);
        long onLeaveEmployees = statusDistribution.getOrDefault("ON_LEAVE", 0L);

        return new DashboardStats(
                totalEmployees,
                activeEmployees,
                inactiveEmployees,
                onLeaveEmployees,
                depts.size(),
                averageSalary,
                departmentDistribution,
                statusDistribution
        );
    }
}
