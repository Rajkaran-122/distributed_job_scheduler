package com.scheduler.platform.integration;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

/**
 * Shared base for integration tests: spins up real PostgreSQL and Redis containers
 * rather than mocking the database or using H2. This matters specifically for this
 * codebase because H2 does not support `FOR UPDATE SKIP LOCKED`, partial indexes, or
 * partitioned tables identically to Postgres -- the exact mechanisms this system's
 * correctness depends on. Testing against a real Postgres via Testcontainers is the
 * only way to actually validate the claiming logic, not just its Java call signature.
 */
@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
public abstract class AbstractIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("job_scheduler_test")
            .withUsername("test")
            .withPassword("test");

    // Plain GenericContainer rather than a dedicated Redis testcontainers module --
    // avoids pulling in a third-party module (and its own transitive/version risk)
    // just to expose one port; Redis needs no special container lifecycle handling.
    @Container
    static final GenericContainer<?> REDIS = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
        registry.add("app.security.jwt.secret", () -> "test-secret-key-at-least-256-bits-long-for-hs256-signing");
    }
}
