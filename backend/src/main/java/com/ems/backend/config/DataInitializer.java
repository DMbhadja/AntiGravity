package com.ems.backend.config;

import com.ems.backend.model.Department;
import com.ems.backend.model.Employee;
import com.ems.backend.repository.DepartmentRepository;
import com.ems.backend.repository.EmployeeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;

    public DataInitializer(DepartmentRepository departmentRepository, EmployeeRepository employeeRepository) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
    }

    @Override
    public void run(String... args) {
        if (departmentRepository.count() == 0) {
            log.info("Seeding initial departments and employees into MySQL database...");

            Department eng = new Department(null, "Engineering", "ENG", "Software engineering, cloud infrastructure, and QA");
            Department hr = new Department(null, "Human Resources", "HR", "Talent acquisition, culture, and people operations");
            Department prd = new Department(null, "Product & Design", "PRD", "Product strategy, UX/UI design, and research");
            Department fin = new Department(null, "Finance & Operations", "FIN", "Financial planning, accounting, and legal");
            Department mkt = new Department(null, "Marketing & Sales", "MKT", "Brand strategy, growth marketing, and partnerships");

            List<Department> savedDepts = departmentRepository.saveAll(List.of(eng, hr, prd, fin, mkt));
            Department savedEng = savedDepts.get(0);
            Department savedHr = savedDepts.get(1);
            Department savedPrd = savedDepts.get(2);
            Department savedFin = savedDepts.get(3);
            Department savedMkt = savedDepts.get(4);

            List<Employee> employees = List.of(
                    new Employee(null, "John", "Doe", "john.doe@company.com", "+1 555-0192",
                            "Senior Full Stack Engineer", 115000.0, LocalDate.of(2022, 3, 15),
                            "ACTIVE", savedEng, "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"),
                    new Employee(null, "Sarah", "Connor", "sarah.connor@company.com", "+1 555-0144",
                            "Lead UI/UX Designer", 98000.0, LocalDate.of(2021, 6, 1),
                            "ACTIVE", savedPrd, "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"),
                    new Employee(null, "Michael", "Scott", "michael.scott@company.com", "+1 555-0111",
                            "HR Operations Manager", 85000.0, LocalDate.of(2020, 1, 10),
                            "ACTIVE", savedHr, "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"),
                    new Employee(null, "Emily", "Blunt", "emily.blunt@company.com", "+1 555-0188",
                            "Senior Financial Analyst", 92000.0, LocalDate.of(2023, 2, 20),
                            "ACTIVE", savedFin, "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80"),
                    new Employee(null, "David", "Miller", "david.miller@company.com", "+1 555-0177",
                            "DevOps Architect", 128000.0, LocalDate.of(2021, 11, 15),
                            "ACTIVE", savedEng, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"),
                    new Employee(null, "Jessica", "Pearson", "jessica.pearson@company.com", "+1 555-0133",
                            "VP of Marketing", 135000.0, LocalDate.of(2019, 8, 5),
                            "ACTIVE", savedMkt, "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"),
                    new Employee(null, "Alex", "Chen", "alex.chen@company.com", "+1 555-0155",
                            "Frontend Developer", 88000.0, LocalDate.of(2023, 7, 10),
                            "ACTIVE", savedEng, "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"),
                    new Employee(null, "Rachel", "Green", "rachel.green@company.com", "+1 555-0166",
                            "People & Culture Specialist", 68000.0, LocalDate.of(2024, 1, 15),
                            "ON_LEAVE", savedHr, "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80")
            );

            employeeRepository.saveAll(employees);
            log.info("Successfully seeded {} departments and {} employees.", savedDepts.size(), employees.size());
        }
    }
}
