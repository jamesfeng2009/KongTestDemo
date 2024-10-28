describe('Service Validation API Tests', () => {
    // Parameterized test data, read from Cypress configuration
    const validateServiceTestCases = Cypress.env('validateServiceTestCases');
    const createRouteTestCases = Cypress.env('createRouteTestCases');
    const createServiceTestCases = Cypress.env('createServiceTestCases');

    // Test service validation schema
    validateServiceTestCases.forEach(({ name, tags }) => {
        it(`should validate service with name: ${name} and tags: ${tags}`, () => {
            cy.request({
                method: 'POST',
                url: '/default/schemas/services/validate',
                body: {
                    name: name,
                    tags: tags,
                    read_timeout: 60000,
                    retries: 5,
                    connect_timeout: 60000,
                    ca_certificates: null,
                    client_certificate: null,
                    write_timeout: 60000,
                    port: 443,
                    url: "https://www.baidu.com"
                }
            }).then((response) => {
                // Assert that the status code is 200
                expect(response.status).to.eq(200);
                
                // Assert that the response contains the specified message
                expect(response.body).to.have.property('message', 'schema validation successful');
            });
        });
    });

    // Test creating a new service, ensuring that no service with the same name exists
    createServiceTestCases.forEach(({ name, tags }) => {
        it(`should create a new service with name: ${name} and validate the response`, () => {
            // Ensure that no service with the same name exists
            cy.request({
                method: 'DELETE',
                url: `/default/services/${name}`,
                failOnStatusCode: false // Do not throw an error if the service does not exist
            }).then((deleteResponse) => {
                cy.log(`Attempted to delete existing service: ${name}, Response Status: ${deleteResponse.status}`);

                // Create a new service
                cy.request({
                    method: 'POST',
                    url: '/default/services',
                    body: {
                        name: name,
                        tags: tags,
                        read_timeout: 60000,
                        retries: 5,
                        connect_timeout: 60000,
                        ca_certificates: null,
                        client_certificate: null,
                        write_timeout: 60000,
                        port: 443,
                        url: "https://www.baidu.com"
                    },
                    failOnStatusCode: false
                }).then((response) => {
                    cy.log(`Service creation response for ${name}: ${JSON.stringify(response.body)}`);
                    // Assert that the status code is 201
                    expect(response.status).to.eq(201);
                    
                    // Assert that the response contains the correct tags and name
                    expect(response.body).to.have.property('name', name);
                    expect(response.body.tags).to.deep.equal(tags);
                });
            });
        });
    });

    // Test retrieving services and creating routes for each service
    it('should retrieve the list of services and create routes for each service', () => {
        cy.request({
            method: 'GET',
            url: '/default/services',
            qs: {
                sort_desc: 1,
                size: 30
            }
        }).then((response) => {
            // Assert that the status code is 200
            expect(response.status).to.eq(200);
            
            // Assert that the response contains services
            const services = response.body.data;
            expect(services).to.be.an('array').that.is.not.empty;
            
            // Log service objects
            services.forEach((service) => {
                cy.log(`Service found with ID: ${service.id}, Name: ${service.name}`);
            });

            // Create a new route for each service
            services.forEach((service) => {
                createRouteTestCases.forEach(({ name, tags, paths }) => {
                    // First check if a route with the same name already exists
                    cy.request({
                        method: 'GET',
                        url: '/default/routes',
                        qs: {
                            name: name
                        },
                        failOnStatusCode: false // Continue if no route is found with the same name
                    }).then((getResponse) => {
                        if (getResponse.status === 200 && getResponse.body.data.length > 0) {
                            // If a route with the same name already exists, delete it
                            const existingRouteId = getResponse.body.data[0].id;
                            cy.request({
                                method: 'DELETE',
                                url: `/default/routes/${existingRouteId}`,
                                failOnStatusCode: false
                            }).then((deleteResponse) => {
                                cy.log(`Deleted existing route with ID: ${existingRouteId}`);
                                // Then create the new route
                                createNewRoute(service.id, name, tags, paths);
                            });
                        } else {
                            // If no route with the same name exists, create the new route
                            createNewRoute(service.id, name, tags, paths);
                        }
                    });
                });
            });
        });
    });

    // Function to create a new route
    function createNewRoute(serviceId, name, tags, paths) {
        cy.request({
            method: 'POST',
            url: '/default/routes',
            body: {
                name: name,
                protocols: ["http", "https"],
                https_redirect_status_code: 426,
                strip_path: true,
                preserve_host: false,
                request_buffering: true,
                response_buffering: true,
                tags: tags,
                service: {
                    id: serviceId
                },
                methods: null,
                hosts: null,
                paths: paths,
                headers: null,
                regex_priority: 0,
                path_handling: "v0",
                sources: null,
                destinations: null,
                snis: null
            }
        }).then((routeResponse) => {
            // Assert that the status code is 201
            expect(routeResponse.status).to.eq(201);
            // Log the response of the route creation
            cy.log(`Route creation response for service ID ${serviceId}: ${JSON.stringify(routeResponse.body)}`);
            
            // Assert that the response contains the correct id, tags, and name
            expect(routeResponse.body).to.have.property('id');
            expect(routeResponse.body).to.have.property('name', name);
            expect(routeResponse.body.tags).to.deep.equal(tags);
        });
    }

    // Test retrieving routes and deleting each one
    it('should retrieve the list of routes and delete each one', () => {
        cy.request({
            method: 'GET',
            url: '/default/routes',
            qs: {
                sort_desc: 1,
                size: 30
            }
        }).then((response) => {
            // Assert that the status code is 200
            expect(response.status).to.eq(200);
            
            // Assert that the response contains routes
            const routes = response.body.data;
            expect(routes).to.be.an('array').that.is.not.empty;
            
            // Log route objects
            routes.forEach((route) => {
                cy.log(`Route found with ID: ${route.id}, Name: ${route.name}`);
            });

            // Delete each route
            routes.forEach((route) => {
                cy.request({
                    method: 'DELETE',
                    url: `/default/routes/${route.id}`,
                    failOnStatusCode: false // Do not fail the test if DELETE fails, for easier debugging
                }).then((deleteResponse) => {
                    // Log the DELETE response status for debugging
                    cy.log(`DELETE Response Status for route ID ${route.id}: ${deleteResponse.status}`);
                    // Assert that the DELETE request returned a 204 status code
                    expect(deleteResponse.status).to.eq(204);
                });
            });
        }).then(() => {
            // Send another GET request to verify that all routes have been deleted
            cy.request({
                method: 'GET',
                url: '/default/routes',
                qs: {
                    sort_desc: 1,
                    size: 30
                }
            }).then((response) => {
                // Assert that the status code is 200
                expect(response.status).to.eq(200);
                
                // Assert that the response contains no routes
                expect(response.body.data).to.be.an('array').that.is.empty;
            });
        });
    });

    // Test deleting all specified services
    it('should delete all specified services', () => {
        cy.request({
            method: 'GET',
            url: '/default/services',
            qs: {
                sort_desc: 1,
                size: 30
            }
        }).then((response) => {
            // Assert that the status code is 200
            expect(response.status).to.eq(200);
            
            // Assert that the response contains services
            const services = response.body.data;
            expect(services).to.be.an('array').that.is.not.empty;

            // Iterate over services and delete each one
            services.forEach((service) => {
                cy.log(`Deleting service with ID: ${service.id}`);
                
                // Delete the service
                cy.request({
                    method: 'DELETE',
                    url: `/default/services/${service.id}`,
                    failOnStatusCode: false // Do not fail the test if DELETE fails, for easier debugging
                }).then((deleteResponse) => {
                    // Log the DELETE response status for debugging
                    cy.log(`DELETE Response Status for service ID ${service.id}: ${deleteResponse.status}`);
                    // Assert that the DELETE request returned a 204 status code
                    expect(deleteResponse.status).to.eq(204);
                });
            });
        });
    });

    // Newly added GET request to verify that the services list is empty when sorted by path
    it('should verify that the services list is empty when sorted by path', () => {
        cy.request({
            method: 'GET',
            url: '/default/services',
            qs: {
                sort_by: 'path',
                size: 30
            }
        }).then((response) => {
            // Assert that the status code is 200
            expect(response.status).to.eq(200);
            
            // Assert that the data property is an empty array
            expect(response.body.data).to.be.an('array').that.is.empty;
        });
    });
});
