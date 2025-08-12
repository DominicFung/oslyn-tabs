#!/bin/zsh

# removing mono repo build.
# In this case, we need to copy shared javascript to the app folder.
# This is to be run inside ./app folder

cp -fR ../src .
cp -fR ../core .