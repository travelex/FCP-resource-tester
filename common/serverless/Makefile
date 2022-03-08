install:
	npm install --no-progress -g \
		serverless@2.50.0 \
		serverless-prune-plugin \
		serverless-plugin-existing-s3 \
		serverless-plugin-lambda-dead-letter \
		serverless-python-requirements

configure:
	echo "{}" | jq '. + {trackingDisabled: true}' > ~/.serverlessrc_tmp
	rm -rf ~/.serverlessrc && mv ~/.serverlessrc_tmp ~/.serverlessrc
