package com.ems.backend.service;

import com.ems.backend.dto.DepartmentRequest;
import com.ems.backend.dto.DepartmentResponse;
import com.ems.backend.exception.BadRequestException;
import com.ems.backend.exception.ResourceNotFoundException;
import com.ems.backend.model.Department;
import com.ems.backend.repository.DepartmentRepository;
import com.ems.backend.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;

    public DepartmentService(DepartmentRepository departmentRepository, EmployeeRepository employeeRepository) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAllWithEmployeeCount();
    }

    @Transactional(readOnly = true)
    public Department getDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
    }

    public Department createDepartment(DepartmentRequest request) {
        if (departmentRepository.existsByName(request.getName())) {
            throw new BadRequestException("Department name already exists: " + request.getName());
        }
        if (departmentRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Department code already exists: " + request.getCode());
        }

        Department department = new Department();
        department.setName(request.getName().trim());
        department.setCode(request.getCode().trim().toUpperCase());
        department.setDescription(request.getDescription());

        return departmentRepository.save(department);
    }

    public Department updateDepartment(Long id, DepartmentRequest request) {
        Department department = getDepartmentById(id);

        if (departmentRepository.existsByNameAndIdNot(request.getName(), id)) {
            throw new BadRequestException("Department name already exists: " + request.getName());
        }
        if (departmentRepository.existsByCodeAndIdNot(request.getCode(), id)) {
            throw new BadRequestException("Department code already exists: " + request.getCode());
        }

        department.setName(request.getName().trim());
        department.setCode(request.getCode().trim().toUpperCase());
        department.setDescription(request.getDescription());

        return departmentRepository.save(department);
    }

    public void deleteDepartment(Long id) {
        Department department = getDepartmentById(id);
        long employeeCount = employeeRepository.countByDepartmentId(id);
        if (employeeCount > 0) {
            throw new BadRequestException("Cannot delete department '" + department.getName() + 
                    "' because it still has " + employeeCount + " assigned employee(s).");
        }
        departmentRepository.delete(department);
    }
}
