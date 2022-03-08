from ansible.errors import AnsibleError, AnsibleParserError
from ansible.plugins.lookup import LookupBase
import boto3

try:
    from __main__ import display
except ImportError:
    from ansible.utils.display import Display
    display = Display()

DOCUMENTATION = '''
    lookup: stack
    author:
      - Chris Atkinson <catkinson(at)gmail.com>
    version_added: 2.5
    short_description: Get logical resources, parameters, or outputs from a AWS Cloudformation stack
    description:
      - Lookup values from AWS Cloudformation stacks based on logical resource names, parameters or outputs.
        This is a way of decoupling templates from one another without having to use export variables. This avoids
        the boilerplate code for each export variable and also pulls the interface between stacks up into the control
        layer. This loosens the coupling between cloudformation templates.  Also the values from stacks can be read
        directly.
    options:
      actimize_network_stack_name:
        description: The boto profile to use. You may use environment variables or the default profile as an alternative.
      logical_resource:
        description: Name of the logical resource defined in the cloudformation template you want to lookup.
      output:
        description: Name of the output defined in the cloudformation template you want to lookup.
      parameter:
        description: Name of the parameter defined in the cloudformation template you want to lookup.
'''

EXAMPLES = '''
# lookup examples:
- name: Lookup a value from the stack named 'testing-ecs-network'
  debug: msg="{{ lookup('stack', 'testing-ecs-network', logical_resource='NATClusterId') }}"
- name: Lookup a logical resource named 'CloudtrailLogGroup' from the stack named 'testing-ecs-network'
  debug: msg="{{ lookup('stack', 'testing-ecs-network', logical_resource='CloudtrailLogGroup') }}"
- name: Lookup a logical resource named 'AppPrivateSubnet1A' from the stack named 'network-stack'
  debug: msg="{{ lookup('stack', 'network-stack', logical_resource='AppPrivateSubnet1A') }}"
'''


class LookupModule(LookupBase):

    def run(self, terms, variables=None, **kwargs):
        '''
            :param terms: stack name to query
                          e.g. 'stack_name'
            :param variables: Value to query, one of following logical_resource, output, parameter
                              e.g. 'logical_resource=CloudtrailLogGroup'
            :return The value of the stack query
        '''

        ret = []
        term = terms[0]
        cfn = None
        if 'logical_resource' in kwargs:
            if 'vars' in variables and 'assumed_role' in variables['vars']:
                cfn = boto3.client(
                    'cloudformation',
                    aws_access_key_id=variables['vars']['assumed_role']['sts_creds']['access_key'],
                    aws_secret_access_key=variables['vars']['assumed_role']['sts_creds']['secret_key'],
                    aws_session_token=variables['vars']['assumed_role']['sts_creds']['session_token']
                )
            else:
                cfn = boto3.client('cloudformation')

            if not cfn:
                raise AnsibleError("Could not create a boto cloudformation client. You have two options: 1. Set AWS_PROFILE; 2. Set the Ansible variable 'assumed_role'")

            logical_resource = kwargs.get('logical_resource')
            try:
                res = cfn.describe_stack_resource(StackName=term, LogicalResourceId=logical_resource)
                ret.append(res.get('StackResourceDetail').get('PhysicalResourceId'))
            except AnsibleParserError:
                raise AnsibleError("could not locate {} in lookup".format(term))
            return ret

        if 'vars' in variables and 'assumed_role' in variables['vars']:
            cfn = boto3.resource(
                'cloudformation',
                aws_access_key_id=variables['vars']['assumed_role']['sts_creds']['access_key'],
                aws_secret_access_key=variables['vars']['assumed_role']['sts_creds']['secret_key'],
                aws_session_token=variables['vars']['assumed_role']['sts_creds']['session_token']
            )
        else:
            cfn = boto3.resource('cloudformation')

        if not cfn:
            raise AnsibleError("Could not create a boto cloudformation client. You have two options: 1. Set AWS_PROFILE; 2. Set the Ansible variable 'assumed_role'")

        if 'output' in kwargs:
            output = kwargs.get('output')
            try:
                stack = cfn.Stack(term)
                for _output in stack.outputs:
                    if _output['OutputKey'] == output:
                        ret.append(_output['OutputValue'])
            except AnsibleParserError:
                raise AnsibleError("could not locate {} in stack outputs lookup".format(term))

        elif 'parameter' in kwargs:
            parameter = kwargs.get('parameter')
            try:
                stack = cfn.Stack(term)
                for _parameter in stack.parameters:
                    if _parameter['ParameterKey'] == parameter:
                        ret.append(_parameter['ParameterValue'])
            except AnsibleParserError:
                raise AnsibleError("could not locate {} in stack parameter lookup".format(term))

        else:
            raise AnsibleError("Call stack lookup with one of ['logical_resource','output','parameter'] only found '{}' in the call".format(kwargs.keys()))

        return ret
