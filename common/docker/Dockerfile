FROM circleci/node:14.17.0

ADD serverless/Makefile /home/circleci/Makefile

RUN cd /home/circleci/ && sudo make install && make configure
