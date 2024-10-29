# KongTestDemo
# Cypress Kong Demo Test Project

This project aims to provide end-to-end automated testing for a Kong Gateway setup using Cypress, Docker, and GitHub Actions for CI/CD. The test cases focus on validating services and routes within the Kong API Gateway.

## Table of Contents
- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Running the Tests](#running-the-tests)
- [Project Structure](#project-structure)
- [Design Considerations](#design-considerations)
- [Assumptions](#assumptions)
- [Trade-offs](#trade-offs)

## Getting Started
These instructions will help you set up the project on your local machine for testing and development purposes.

## Prerequisites
Before getting started, ensure that you have the following software installed on your local machine:
- [Node.js](https://nodejs.org/) (v20.16.0 or later)
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/)

## Local Setup
To set up the project locally, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Install project dependencies**:
   Make sure you are inside the project directory, then run:
   ```bash
   npm install
   ```

3. **Start Kong Services using Docker Compose**:
   Run the following command to start the Kong services:
   ```bash
   docker-compose -f ./docker-compose/docker-compose.yml up -d
   ```
   This command will launch Kong Gateway services required for testing.

4. **Wait for Kong to be Ready**:
   Make sure Kong is fully started by checking:
   ```bash
   curl http://localhost:8001
   ```
   If you get a response, Kong is up and running.

## Running the Tests
1. **Run Cypress Tests**:
   ```bash
   npm run test
   ```

2. **Generate Test Report**:
   The project uses Mochawesome to generate HTML reports. After running tests, use the following command to merge JSON reports and create an HTML report:
   ```bash
   npm run report
   ```

   - **Report Cleanup**: The `npm run report` script will also clean any existing report files before generating new reports.

3. **Access Test Report**:
   The HTML report can be found in `cypress/results/report.html`. Open this file in a web browser to see the detailed test results.

## Project Structure
- `cypress/`: Contains Cypress tests and related configurations.
- `docker-compose/`: Contains Docker Compose file to set up Kong services.
- `cypress.config.js`: Cypress configuration including test parameters and report setup.
- `package.json`: Project dependencies and npm scripts.

## Design Considerations
- **Containerized Kong Services**: The choice of Docker to containerize Kong was made to simplify local and CI/CD testing environments, ensuring consistency across different systems.
- **Test Automation**: Cypress was selected as the test automation tool for its capabilities in API testing and the rich reporting features provided by Mochawesome.
- **CI/CD Integration**: GitHub Actions is used to automate testing and reporting, providing continuous integration checks for each pull request.

## Assumptions
- **Service Availability**: It is assumed that Kong services are available at `http://localhost:8001` once Docker Compose is up.
- **Node.js Compatibility**: The project assumes compatibility with Node.js version 20 or later, due to the version used during development.
- **Static Endpoints**: The endpoints used for service and route testing in Kong are static, and no dynamic updates are considered during tests.

## Trade-offs
- **Docker Overhead**: Docker simplifies service setup but adds an additional layer of complexity and overhead compared to using a local installation of Kong.
- **Test Execution Time**: Starting Kong with Docker adds some latency, but it ensures a clean, isolated environment for each test run, which is critical for avoiding inconsistencies.
- **Mochawesome Reports**: Using Mochawesome for reporting gives a good level of detail, but it adds extra dependencies and complexity. Alternatives like Allure were considered but discarded due to setup issues during CI/CD integration.


