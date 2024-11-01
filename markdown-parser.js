"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("node:fs");
var readline = require("readline");
var template = function (body) {
    return "\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta http-equiv=\"content-type\" content=\"text/html; charset=UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0, user-scalable=no\">\n    <meta name=\"author\" content=\"\">\n    <meta name=\"description\" content=\"\">\n    <meta name=\"keywords\" content=\"\">\n    <title>Document</title>\n\n    <link rel=\"stylesheet\" href=\"style.css\">\n</head>\n<body>\n".concat(body, "\n</body>\n</html>\n");
};
var parser = function (file) { return __awaiter(void 0, void 0, void 0, function () {
    var fileStream, lineReader, output, _a, lineReader_1, lineReader_1_1, line, headingArray, headingLevel, headingText, e_1_1;
    var _b, e_1, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                fileStream = fs.createReadStream(file);
                lineReader = readline.createInterface({
                    input: fileStream,
                    crlfDelay: Infinity,
                });
                output = [];
                _e.label = 1;
            case 1:
                _e.trys.push([1, 6, 7, 12]);
                _a = true, lineReader_1 = __asyncValues(lineReader);
                _e.label = 2;
            case 2: return [4 /*yield*/, lineReader_1.next()];
            case 3:
                if (!(lineReader_1_1 = _e.sent(), _b = lineReader_1_1.done, !_b)) return [3 /*break*/, 5];
                _d = lineReader_1_1.value;
                _a = false;
                line = _d;
                if (line.trim()[0] === "#") {
                    headingArray = line.trim().split(" ");
                    console.log(headingArray);
                    headingLevel = headingArray[0].length;
                    headingText = headingArray.slice(1).join(" ");
                    console.log("<h".concat(headingLevel, ">").concat(headingText, "</h").concat(headingLevel, ">"));
                    output.push("<h".concat(headingLevel, ">").concat(headingText, "</h").concat(headingLevel, ">"));
                }
                else {
                    output.push("<p>".concat(line, "</p>"));
                }
                _e.label = 4;
            case 4:
                _a = true;
                return [3 /*break*/, 2];
            case 5: return [3 /*break*/, 12];
            case 6:
                e_1_1 = _e.sent();
                e_1 = { error: e_1_1 };
                return [3 /*break*/, 12];
            case 7:
                _e.trys.push([7, , 10, 11]);
                if (!(!_a && !_b && (_c = lineReader_1.return))) return [3 /*break*/, 9];
                return [4 /*yield*/, _c.call(lineReader_1)];
            case 8:
                _e.sent();
                _e.label = 9;
            case 9: return [3 /*break*/, 11];
            case 10:
                if (e_1) throw e_1.error;
                return [7 /*endfinally*/];
            case 11: return [7 /*endfinally*/];
            case 12: return [2 /*return*/, output.join("\n")];
        }
    });
}); };
var writer = function (html) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        fs.writeFile('./output.html', template(html), function (err) {
            if (err) {
                console.log(err);
            }
            else {
                console.log('file written');
            }
        });
        return [2 /*return*/];
    });
}); };
var generateHtmlFromMd = function (file) { return __awaiter(void 0, void 0, void 0, function () {
    var parsedMd;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, parser(file)];
            case 1:
                parsedMd = _a.sent();
                writer(parsedMd);
                return [2 /*return*/];
        }
    });
}); };
generateHtmlFromMd('./test.md');
