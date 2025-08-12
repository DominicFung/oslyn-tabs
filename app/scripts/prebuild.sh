echo "running app pre-build ..."
cp -R ../src .

find . -type f -name '._*' -delete
find . -type f -name '.DS_Store' -delete