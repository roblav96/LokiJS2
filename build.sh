#!/usr/bin/env bash

set -u -e -o pipefail

readonly currentDir=$(cd $(dirname $0); pwd)

cd ${currentDir}

PACKAGES=(
  core
  full-text-search
  adapter-fs-adapter
  adapter-indexed-adapter
  adapter-local-storage
  )

VERSION_PREFIX=$(node -p "require('./package.json').version")

for ARG in "$@"; do
  case "$ARG" in
  esac
done

UGLIFYJS=`pwd`/node_modules/uglify-es/bin/uglifyjs

VERSION="${VERSION_PREFIX}"
echo "====== BUILDING: Version ${VERSION}"

for PACKAGE in ${PACKAGES[@]}
do
  cd ${currentDir}

  PWD=`pwd`
  ROOT_DIR=${PWD}/packages
  SRC_DIR=${ROOT_DIR}/${PACKAGE}
  ROOT_OUT_DIR=${PWD}/dist/packages
  OUT_DIR=${ROOT_OUT_DIR}/${PACKAGE}
  NPM_DIR=${PWD}/dist/packages-dist/${PACKAGE}
  FILENAME=${PACKAGE}.js
  FILENAME_MINIFIED=${PACKAGE}.min.js

  echo "======      [${PACKAGE}]: PACKING    ====="
  rm -rf ${OUT_DIR}
  webpack --config=config/webpack.config.js --entry=${SRC_DIR}/src/index.js --output-library=${PACKAGE} --output-path=${OUT_DIR} --output-filename=${FILENAME} > /dev/null || true

  echo "======      [${PACKAGE}]: BUNDLING   ====="
  rm -rf ${NPM_DIR} && mkdir -p ${NPM_DIR}

  rsync -a ${OUT_DIR}/ ${NPM_DIR}
  rsync -am --include="package.json" --include="*/" --exclude=* ${SRC_DIR}/ ${NPM_DIR}/

  echo "======      [${PACKAGE}]: MINIFY     ====="
  cd ${OUT_DIR}
  $UGLIFYJS ${FILENAME} > ${FILENAME_MINIFIED}

  echo "======      [${PACKAGE}]: VERSIONING ====="
  cd ${NPM_DIR}
  perl -p -i -e "s/0\.0\.0\-PLACEHOLDER/${VERSION}/g" $(grep -ril 0\.0\.0\-PLACEHOLDER .) < /dev/null 2> /dev/null

done

for PACKAGE in ${PACKAGES[@]}
do
  cd ${currentDir}

  PWD=`pwd`
  NPM_DIR=${PWD}/dist/packages-dist/${PACKAGE}

  echo "======      [${PACKAGE}]: PUBLISHING ====="
  cd ${NPM_DIR}
  npm publish
done
