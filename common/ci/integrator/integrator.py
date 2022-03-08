import os
import sys
import github
import subprocess
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
logger.addHandler(handler)

github_repository_name = os.getenv("INTEGRATOR_GITHUB_REPOSITORY")
github_token = os.getenv("INTEGRATOR_GITHUB_TOKEN")

logger.info("Using Github token ending " + github_token[-4:])
github = github.Github(github_token)
logger.info("Using %s as Github repository name" % github_repository_name)
github_repo = github.get_repo(github_repository_name)

github_branches = github_repo.get_branches()
branch_names = []
for github_branch in github_branches:
    logger.info("Found %s branch" % github_branch.name)
    if github_branch.name.startswith(os.getenv("INTEGRATOR_BRANCH_PREFIX")):
        branch_names.append(github_branch.name)

for branch_name in branch_names:
    branch_to_merge = 'origin/' + branch_name
    logger.info("Merging %s branch into the currently checked out branch" % branch_to_merge)
    merge_process = subprocess.Popen(["git", "merge", branch_to_merge], stdout = subprocess.PIPE)
    merge_output = merge_process.communicate()[0]
    logger.info("Output: %s" % merge_output)
    if merge_process.returncode is not 0:
        logger.error("Merge failed, exiting")
        sys.exit(31)
