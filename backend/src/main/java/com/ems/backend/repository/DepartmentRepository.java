package com.ems.backend.repository;

import com.ems.backend.dto.DepartmentResponse;
import com.ems.backend.model.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByName(String name);
    Optional<Department> findByCode(String code);
    boolean existsByName(String name);
    boolean existsByCode(String code);
    boolean existsByNameAndIdNot(String name, Long id);
    boolean existsByCodeAndIdNot(String code, Long id);

    @Query("SELECT new com.ems.backend.dto.DepartmentResponse(d.id, d.name, d.code, d.description, d.createdAt, COUNT(e.id)) " +
           "FROM Department d LEFT JOIN Employee e ON e.department.id = d.id " +
           "GROUP BY d.id, d.name, d.code, d.description, d.createdAt ORDER BY d.name ASC")
    List<DepartmentResponse> findAllWithEmployeeCount();
}
