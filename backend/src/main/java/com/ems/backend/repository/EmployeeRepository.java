package com.ems.backend.repository;

import com.ems.backend.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);
    List<Employee> findByDepartmentId(Long departmentId);
    long countByDepartmentId(Long departmentId);
    long countByStatus(String status);

    @Query("SELECT e FROM Employee e " +
           "LEFT JOIN FETCH e.department d " +
           "WHERE (:search IS NULL OR :search = '' OR " +
           "       LOWER(e.firstName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "       LOWER(e.lastName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "       LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "       LOWER(e.jobTitle) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "  AND (:departmentId IS NULL OR d.id = :departmentId) " +
           "  AND (:status IS NULL OR :status = '' OR e.status = :status) " +
           "ORDER BY e.id DESC")
    List<Employee> searchEmployees(@Param("search") String search,
                                  @Param("departmentId") Long departmentId,
                                  @Param("status") String status);

    @Query("SELECT e.status, COUNT(e.id) FROM Employee e GROUP BY e.status")
    List<Object[]> countEmployeesByStatusGroup();

    @Query("SELECT COUNT(e.id), AVG(e.salary) FROM Employee e")
    Object[] getEmployeeCountAndAvgSalary();

    @Query("SELECT AVG(e.salary) FROM Employee e")
    Double getAverageSalary();
}
