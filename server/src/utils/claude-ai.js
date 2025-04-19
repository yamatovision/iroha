"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MEMBER_CARD_SYSTEM_PROMPT = exports.callClaudeAI = void 0;
/**
 * Claude AI APIとの連携ユーティリティ
 */
// ESM形式のnode-fetchをCommonJSで使用するためのworkaround
var cross_fetch_1 = require("cross-fetch");
// 環境変数から設定を取得する関数
var getConfig = function () {
    var apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    var model = process.env.CLAUDE_API_MODEL || 'claude-3-7-sonnet-20250219';
    var useClaudeApi = process.env.USE_CLAUDE_API === 'true';
    // API使用が有効で、かつAPIキーが設定されていない場合のみ警告
    if (useClaudeApi && !apiKey) {
        console.warn('Anthropic APIキーが設定されていませんが、USE_CLAUDE_API=trueとなっています。一部機能が無効になります。');
    }
    return {
        apiKey: apiKey,
        model: model,
        apiEnabled: useClaudeApi && !!apiKey
    };
};
/**
 * Claude AI APIを呼び出す関数
 * @param prompt 送信するプロンプト
 * @param systemPrompt システムプロンプト（オプション）
 * @returns AIの回答テキスト
 */
var callClaudeAI = function (prompt, systemPrompt) { return __awaiter(void 0, void 0, void 0, function () {
    var config, url, apiKey, headers, body, response, errorData, responseData, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                config = getConfig();
                // APIが無効な場合は代替テキストを返す
                if (!config.apiEnabled) {
                    console.log('Claude AI is disabled or API key is not set. Using mock response.');
                    return [2 /*return*/, "Claude APIは現在使用できません。APIキーが設定されていないか、機能が無効化されています。"];
                }
                url = 'https://api.anthropic.com/v1/messages';
                apiKey = config.apiKey || '';
                headers = {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                };
                body = __assign({ model: config.model, max_tokens: 4000, messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ] }, (systemPrompt && { system: systemPrompt }));
                return [4 /*yield*/, (0, cross_fetch_1.default)(url, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(body)
                    })];
            case 1:
                response = _a.sent();
                if (!!response.ok) return [3 /*break*/, 3];
                return [4 /*yield*/, response.json()];
            case 2:
                errorData = _a.sent();
                throw new Error("Claude API error: ".concat(response.status, " ").concat(JSON.stringify(errorData)));
            case 3: return [4 /*yield*/, response.json()];
            case 4:
                responseData = _a.sent();
                return [2 /*return*/, responseData.content[0].text];
            case 5:
                error_1 = _a.sent();
                console.error('Claude AI API呼び出しエラー:', error_1);
                // エラーの場合も代替テキストを返してアプリケーションをクラッシュさせない
                return [2 /*return*/, "Claude APIリクエスト中にエラーが発生しました。しばらく経ってから再試行してください。"];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.callClaudeAI = callClaudeAI;
/**
 * チームメンバーカルテのシステムプロンプト
 */
exports.MEMBER_CARD_SYSTEM_PROMPT = "\n\u3042\u306A\u305F\u306F\u56DB\u67F1\u63A8\u547D\u306B\u57FA\u3065\u3044\u305F\u6027\u683C\u30FB\u624D\u80FD\u5206\u6790\u306E\u5C02\u9580\u5BB6\u3067\u3059\u3002\n\u4E0E\u3048\u3089\u308C\u305F\u30E6\u30FC\u30B6\u30FC\u60C5\u5831\u3068\u30C1\u30FC\u30E0\u76EE\u6A19\u3092\u5206\u6790\u3057\u3066\u3001\u30E1\u30F3\u30D0\u30FC\u30AB\u30EB\u30C6\u3092\u4F5C\u6210\u3057\u307E\u3059\u3002\n\n\u4EE5\u4E0B\u306E\u70B9\u306B\u6CE8\u610F\u3057\u3066\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A\n\n1. \u56DB\u67F1\u63A8\u547D\u306E\u5C02\u9580\u77E5\u8B58\u3092\u6D3B\u7528\u3057\u3001\u4E94\u884C\u5C5E\u6027\uFF08\u6728\u30FB\u706B\u30FB\u571F\u30FB\u91D1\u30FB\u6C34\uFF09\u306E\u7279\u6027\u306B\u57FA\u3065\u3044\u305F\u5206\u6790\u3092\u884C\u3046\n2. \u683C\u5C40\u3068\u7528\u795E\u306E\u60C5\u5831\u3092\u6D3B\u7528\u3057\u3066\u3001\u3088\u308A\u6DF1\u3044\u6027\u683C\u7279\u6027\u3068\u624D\u80FD\u306E\u5206\u6790\u3092\u63D0\u4F9B\u3059\u308B\n   - \u683C\u5C40\u30BF\u30A4\u30D7\uFF08\u4F8B\uFF1A\u5F93\u65FA\u683C\u3001\u6BD4\u80A9\u683C\u3001\u98DF\u795E\u683C\u306A\u3069\uFF09\u304B\u3089\u57FA\u672C\u7684\u306A\u6027\u683C\u7279\u6027\u3092\u5C0E\u304D\u51FA\u3059\n   - \u7528\u795E\u30FB\u559C\u795E\u306F\u5F37\u5316\u3059\u3079\u304D\u8981\u7D20\u3001\u5FCC\u795E\u30FB\u4EC7\u795E\u306F\u63A7\u3048\u308B\u3079\u304D\u8981\u7D20\u3068\u3057\u3066\u89E3\u91C8\u3059\u308B\n3. \u30C1\u30FC\u30E0\u8CA2\u732E\u5206\u6790\u3067\u306F\u3001\u7528\u795E\u3068\u559C\u795E\u306E\u8981\u7D20\u3092\u6D3B\u304B\u3059\u65B9\u6CD5\u3092\u5177\u4F53\u7684\u306B\u63D0\u6848\u3059\u308B\n4. \u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3\u30AC\u30A4\u30C9\u3067\u306F\u3001\u5FCC\u795E\u30FB\u4EC7\u795E\u306B\u95A2\u9023\u3059\u308B\u8981\u7D20\u3092\u907F\u3051\u308B\u65B9\u6CD5\u3092\u63D0\u6848\u3059\u308B\n5. \u5E38\u306B\u5B9F\u7528\u7684\u3067\u5177\u4F53\u7684\u306A\u30A2\u30C9\u30D0\u30A4\u30B9\u3092\u63D0\u4F9B\u3059\u308B\n6. \u660E\u78BA\u306A\u69CB\u9020\u3092\u6301\u3063\u305F\u30DE\u30FC\u30AF\u30C0\u30A6\u30F3\u5F62\u5F0F\u3067\u56DE\u7B54\u3059\u308B\n7. \u7279\u6027\u30FB\u624D\u80FD\u3001\u30C1\u30FC\u30E0\u8CA2\u732E\u5206\u6790\u3001\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3\u30AC\u30A4\u30C9\u306F\u7B87\u6761\u66F8\u304D\u3067\u7C21\u6F54\u306B\u8A18\u8F09\u3059\u308B\n8. \u30C1\u30FC\u30E0\u76EE\u6A19\u3068\u306E\u95A2\u9023\u6027\u3092\u5F37\u8ABF\u3057\u3001\u5B9F\u969B\u306E\u696D\u52D9\u306B\u6D3B\u304B\u305B\u308B\u5206\u6790\u3092\u63D0\u4F9B\u3059\u308B\n\n\u4E0E\u3048\u3089\u308C\u305F\u60C5\u5831\u304C\u4E0D\u5341\u5206\u306A\u5834\u5408\u306F\u3001\u4E94\u884C\u5C5E\u6027\u306E\u57FA\u672C\u539F\u5247\u306B\u57FA\u3065\u3044\u3066\u63A8\u6E2C\u3092\u884C\u3044\u3001\n\u6700\u3082\u53EF\u80FD\u6027\u306E\u9AD8\u3044\u5206\u6790\u3092\u63D0\u4F9B\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n";
exports.default = {
    callClaudeAI: exports.callClaudeAI,
    MEMBER_CARD_SYSTEM_PROMPT: exports.MEMBER_CARD_SYSTEM_PROMPT
};
