import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.env.npm_package_version;

// also update in api
let apiPackage = JSON.parse(readFileSync("package_api/package.json", "utf8"));
apiPackage.version = targetVersion;
writeFileSync("package_api/package.json", JSON.stringify(apiPackage, null, "\t"));

// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

// update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
writeFileSync("package_api/versions.json", JSON.stringify(versions, null, "\t"));
