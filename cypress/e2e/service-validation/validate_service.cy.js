describe('Service Validation API Tests', () => {
    // 参数化测试数据，从 Cypress 配置中读取
    const validateServiceTestCases = Cypress.env('validateServiceTestCases');

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
    const createServiceTestCases = Cypress.env('createServiceTestCases');
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
                    expect(response.body.tags).to.include(tags[0]);
                });
            });
        });
    });

    // 测试查询服务接口
    it('should retrieve the list of services and log the service details', () => {
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
