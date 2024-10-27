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

    // 测试创建新服务接口
const createServiceTestCases = Cypress.env('createServiceTestCases');
createServiceTestCases.forEach(({ name, tags }) => {
    it(`should create a new service with name: ${name} and validate the response`, () => {
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
            }
        }).then((response) => {
            // 校验响应状态码为 201
            expect(response.status).to.eq(201);
            
            // 校验返回对象的 tags 和 name 属性
            expect(response.body).to.have.property('name', name);
            expect(response.body.tags).to.include(tags[0]);
        });
    });
});


    // 测试查询新建的服务接口并删除它
    it('should retrieve the list of services and delete the specified service', () => {
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
            
            // 校验返回的数据是否包含特定服务
            const services = response.body.data;
            expect(services).to.be.an('array').that.is.not.empty;
            
            const service = services.find(s => s.name === 'service1');
            expect(service).to.exist;
            expect(service).to.have.property('name', 'service1');
            expect(service.tags).to.include('service1');

            // 删除新建的服务
            cy.request({
                method: 'DELETE',
                url: `/default/services/${service.id}`
            }).then((deleteResponse) => {
                // 校验 DELETE 请求的响应状态码为 204
                expect(deleteResponse.status).to.eq(204);
            });
        });
    });
});
