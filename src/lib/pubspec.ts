import { readFileSync } from "fs";
import * as yaml from "js-yaml";

/** Utility class for reading and parsing a Dart/Flutter pubspec.yaml file. */
export class Pubspec {

    /** Reads a YAML file at the given path and parses its content. */
    static parse(path: string): any {
        const pubspecPath = new URL(path, import.meta.url);
        const fileContent = readFileSync(pubspecPath, "utf-8");

        return yaml.load(fileContent);
    }
}
