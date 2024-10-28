describe('Service Validation API Tests', () => {
    // 参数化测试数据，从 Cypress 配置中读取
    const validateServiceTestCases = Cypress.env('validateServiceTestCases');
    const createRouteTestCases = Cypress.env('createRouteTestCases');
    const createServiceTestCases = Cypress.env('createServiceTestCases');

    // 测试验证服务配置接口
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
                // 校验响应状态码为 200
                expect(response.status).to.eq(200);
                
                // 校验响应体是否包含指定的 message 字段
                expect(response.body).to.have.property('message', 'schema validation successful');
            });
        });
    });

    // 测试创建新服务接口，确保没有同名服务存在
    createServiceTestCases.forEach(({ name, tags }) => {
        it(`should create a new service with name: ${name} and validate the response`, () => {
            // 确保没有同名服务存在
            cy.request({
                method: 'DELETE',
                url: `/default/services/${name}`,
                failOnStatusCode: false // 即使服务不存在也不报错
            }).then((deleteResponse) => {
                cy.log(`Attempted to delete existing service: ${name}, Response Status: ${deleteResponse.status}`);

                // 创建新服务
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
                    // 校验响应状态码为 201
                    expect(response.status).to.eq(201);
                    
                    // 校验返回对象的 tags 和 name 属性
                    expect(response.body).to.have.property('name', name);
                    expect(response.body.tags).to.deep.equal(tags);
                });
            });
        });
    });

    // 测试查询服务接口并为每个服务创建路由
    it('should retrieve the list of services and create routes for each service', () => {
        cy.request({
            method: 'GET',
            url: '/default/services',
            qs: {
                sort_desc: 1,
                size: 30
            }
        }).then((response) => {
            // 校验响应状态码为 200
            expect(response.status).to.eq(200);
            
            // 校验返回的数据是否包含服务
            const services = response.body.data;
            expect(services).to.be.an('array').that.is.not.empty;
            
            // 打印服务对象
            services.forEach((service) => {
                cy.log(`Service found with ID: ${service.id}, Name: ${service.name}`);
            });

            // 为每个服务创建新路由
            services.forEach((service) => {
                createRouteTestCases.forEach(({ name, tags, paths }) => {
                    // 首先检查是否已经存在同名的路由
                    cy.request({
                        method: 'GET',
                        url: '/default/routes',
                        qs: {
                            name: name
                        },
                        failOnStatusCode: false // 如果没有找到同名路由，继续执行
                    }).then((getResponse) => {
                        if (getResponse.status === 200 && getResponse.body.data.length > 0) {
                            // 如果已经存在同名路由，则先删除它
                            const existingRouteId = getResponse.body.data[0].id;
                            cy.request({
                                method: 'DELETE',
                                url: `/default/routes/${existingRouteId}`,
                                failOnStatusCode: false
                            }).then((deleteResponse) => {
                                cy.log(`Deleted existing route with ID: ${existingRouteId}`);
                                // 然后再创建新的路由
                                createNewRoute(service.id, name, tags, paths);
                            });
                        } else {
                            // 如果没有同名路由，直接创建
                            createNewRoute(service.id, name, tags, paths);
                        }
                    });
                });
            });
        });
    });

    // 创建新路由的函数
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
            // 校验响应状态码为 201
            expect(routeResponse.status).to.eq(201);
            // 打印路由创建响应
            cy.log(`Route creation response for service ID ${serviceId}: ${JSON.stringify(routeResponse.body)}`);
            
            // 校验返回对象的 id, tags, name 属性
            expect(routeResponse.body).to.have.property('id');
            expect(routeResponse.body).to.have.property('name', name);
            expect(routeResponse.body.tags).to.deep.equal(tags);
        });
    }

    // 测试查询路由接口并删除所有路由
    it('should retrieve the list of routes and delete each one', () => {
        cy.request({
            method: 'GET',
            url: '/default/routes',
            qs: {
                sort_desc: 1,
                size: 30
            }
        }).then((response) => {
            // 校验响应状态码为 200
            expect(response.status).to.eq(200);
            
            // 校验返回的数据是否包含路由
            const routes = response.body.data;
            expect(routes).to.be.an('array').that.is.not.empty;
            
            // 打印路由对象
            routes.forEach((route) => {
                cy.log(`Route found with ID: ${route.id}, Name: ${route.name}`);
            });

            // 遍历路由并删除每一个
            routes.forEach((route) => {
                cy.request({
                    method: 'DELETE',
                    url: `/default/routes/${route.id}`,
                    failOnStatusCode: false // 即使 DELETE 失败也不使测试直接失败，方便调试
                }).then((deleteResponse) => {
                    // 打印 DELETE 响应状态码以进行调试
                    cy.log(`DELETE Response Status for route ID ${route.id}: ${deleteResponse.status}`);
                    // 校验 DELETE 请求的响应状态码为 204
                    expect(deleteResponse.status).to.eq(204);
                });
            });
        }).then(() => {
            // 再次请求 GET 接口以确认所有路由已被删除
            cy.request({
                method: 'GET',
                url: '/default/routes',
                qs: {
                    sort_desc: 1,
                    size: 30
                }
            }).then((response) => {
                // 校验响应状态码为 200
                expect(response.status).to.eq(200);
                
                // 校验返回的数据是否为空
                expect(response.body.data).to.be.an('array').that.is.empty;
            });
        });
    });

    // 测试删除所有服务接口
    it('should delete all specified services', () => {
        cy.request({
            method: 'GET',
            url: '/default/services',
            qs: {
                sort_desc: 1,
                size: 30
            }
        }).then((response) => {
            // 校验响应状态码为 200
            expect(response.status).to.eq(200);
            
            // 校验返回的数据是否包含服务
            const services = response.body.data;
            expect(services).to.be.an('array').that.is.not.empty;

            // 遍历服务并删除每一个
            services.forEach((service) => {
                cy.log(`Deleting service with ID: ${service.id}`);
                
                // 删除服务
                cy.request({
                    method: 'DELETE',
                    url: `/default/services/${service.id}`,
                    failOnStatusCode: false // 即使 DELETE 失败也不使测试直接失败，方便调试
                }).then((deleteResponse) => {
                    // 打印 DELETE 响应状态码以进行调试
                    cy.log(`DELETE Response Status for service ID ${service.id}: ${deleteResponse.status}`);
                    // 校验 DELETE 请求的响应状态码为 204
                    expect(deleteResponse.status).to.eq(204);
                });
            });
        });
    });
});
