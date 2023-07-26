#!/bin/bash

BRANCH=$CI_COMMIT_REF_NAME

if [ -z "$BRANCH" ]
then
    echo 3;
    echo "Can't find branch name"
    exit 1;
fi

echo "detected branch - $BRANCH";

reload() {
    git clone https://github.com/2smart-tech/modbus-bridge-hardware.git
    rm -rf etc/config.nodes
    rm -rf etc/hardware-maintain
    mv modbus-bridge-hardware/hardware etc/config.nodes
    mv modbus-bridge-hardware/hardware-maintain etc/hardware-maintain
    rm -rf etc/modbus-bridge-hardware
}

build() {
    node ./.build/build_hardware_deps.js
}

commit() {
    git config user.email "$GIT_EMAIL"
    git config user.name "$GIT_USER"
    git remote set-url origin $(git config --get remote.origin.url | sed "s:\/[^\/:@]*\:[^\/:@]*@:\\/oauth2\:${GITLAB_WRITE_TOKEN}\@:")
        
    git add etc/config.nodes
    git add etc/hardware-maintain
    git add 2smart.configuration.json
    git add README.md

    # if [ -z "$(git status -b $BRANCH -uno --porcelain)" ];
    # then
    #     echo "No hardware changes"
    # else
    #     git status
    #     echo "Detected hardware changes"
    #     git commit -m "AUTO COMMIT. HARDWARE CHANGES"
    #     git push origin HEAD:$BRANCH
    #     echo "Made commit, exiting pipeline"
    #     exit 1
    # fi
    if git commit -m "AUTO COMMIT. HARDWARE CHANGES";
    then
        git status
        echo "Detected hardware changes"
        
        git push origin HEAD:$BRANCH
        echo "Made commit, exiting pipeline"
        exit 1
    else
        echo "No hardware changes"
    fi
}

reload

build

commit
