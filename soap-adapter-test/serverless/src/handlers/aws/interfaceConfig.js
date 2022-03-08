
/**
 * Utility domain endpoint URI: eif/utility/adapter/api/{type}?id={request Id from interface config}
 * Here, type can be either soap or rest
 * 
 * Adapter URI: /utility/adapter/api/soap?id={request Id from interface config}
 * type can be soap or rest
 */

let interfaceConfig = {
    soap: [{
        id: "txm-salt",
        config: {
            env: [
                { name: "NODE_TLS_REJECT_UNAUTHORIZED", value: "0" }
            ],
            // wsdl: "http://in-lt-j37566:8080/?wsdl", // wsdl of service hosted on local machine mock server in Soap UI
            // wsdl: "https://app.sit.salt.travelex.com/VaultNotificationService.svc?wsdl",
            wsdl: "https://app.uat.salt.travelex.com/VaultNotificationService.svc?wsdl",
            // endpoint: "http://IN-LT-J37566:8080",// local machine mock server in Soap UI
            endpoint: "https://app.uat.salt.travelex.com/VaultNotificationService.svc",
            // endpoint: "https://app.sit.salt.travelex.com/VaultNotificationService.svc",
            dnsEntry:{
                "host":"",
                "ip":""
            },
            auth: {
                type: "twoWay",
                twoWay: {
                    certificates: {
                        cert: ["ssm-secure-param-name"],
                        key: ["ssm-secure-param-name"],
                        ca: [
                            ["ssm-secure-param-name"]
                            /** These are array in case the certificate size is huge and its content cannot fit in one
                    * param then add them in series of params and string concat them before use. 
                    * Attributes from these oneWay and TwoWay will go under auth.option section in code and
                    * then final auth.option will go under operation's specific option section
                    * */
                        ]
                    }

                }
            },
            oneWay: {
                certificates: {
                    cert: ["ssm-secure-param-name"],
                    ca: [
                        ["ssm-secure-param-name"]
                    ]
                }
            },
            wsdlOptions: {
                /**
                 * This section will go as wsdl_options attribute under options attribute of every operation
                 *  specific options attribute. The final options atrribute should go as it is in
                 *  soap package's options attribute to keep it extendable in nature.
                 */
                // rejectUnauthorized: false,
                // hostname: "GB-PB-GEC-VT2",
                //strictSSL: false,
                //secureOptions: "constants.SSL_OP_NO_TLSv1_2" // this is likely needed for node >= 10.0)
            }
        },
        operations: [{
            name: "Update",
            request: {
                custom: {
                    /** The scope of the feature to be implemented in this rule is in the hands of developer.
                     * Above attributes like auth are all optional so that if auth section is not specifed above
                     * then it should be handled in this rule file if required by the service.
                     * All customization should be handled within this service.
                     * Above all soap attributes included in interface config should be avaiable
                     * to the rule file to use it for building its custom logic of marshalling/request creation.
                     */
                    rule: "s3 file path" // this file should have the method named apply or marshall
                },
                batch: {
                    /** Should be implemented in both simple and complex sections */
                    "entriesInRequest": 20,
                    "concurrentRequest": 5,
                    "requestPerIteration": 2
                },
                options: {
                    /** This option attribute should go as it is under soap package's option attribute.
                     * So that tomorrow if we need to use any of the soecific attribute from soap package option's attribute,
                     * we dont need to change the code. Just include it in interface config and it should work as it is.
                     * This will also contain the wsdl_options attribute whose values are mapped from options attribute in the above
                     * config section in this schema.
                     **/
                    namespaceArrayElements: false

                }
            },
            response: {
                /** Use to interpret the response and do any further required activity. */
                custom: {
                    rule: "s3 file path" // this file should have the method named apply or unmarshall
                }
            }
        }]
    }]
}

module.exports = interfaceConfig