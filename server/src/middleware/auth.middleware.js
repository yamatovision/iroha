"use strict";
/**
 * @deprecated このファイルはレガシーです。代わりに hybrid-auth.middleware.ts を使用してください。
 */
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
exports.requireSuperAdmin = exports.requireAdmin = exports.authenticate = exports.UserRole = void 0;
// Userモデルに合わせた独自の権限列挙型
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "User";
    UserRole["ADMIN"] = "Admin";
    UserRole["SUPER_ADMIN"] = "SuperAdmin";
})(UserRole || (exports.UserRole = UserRole = {}));
/**
 * 認証不要なパスのリスト
 */
var PUBLIC_PATHS = [
    // 四柱推命プロフィール関連の公開API
    '/api/v1/saju-profiles/available-cities',
    '/api/v1/saju-profiles/city-coordinates',
    '/api/v1/saju-profiles/local-time-offset',
];
/**
 * 認証をバイパスできるパスかチェックする
 * @param path リクエストパス
 * @returns 認証不要なパスならtrue
 */
var isPublicPath = function (path) {
    return PUBLIC_PATHS.some(function (publicPath) {
        return path === publicPath ||
            (publicPath.endsWith('/') ? path.startsWith(publicPath) : path.startsWith(publicPath + '/'));
    });
};
/**
 * レガシー認証ミドルウェア - hybrid-auth.middleware.ts を使用してください
 */
var authenticate = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        console.warn('レガシー認証ミドルウェアが使用されています。hybrid-auth.middleware.ts に移行してください。');
        // 認証不要なパスの場合はスキップ
        if (isPublicPath(req.path)) {
            return [2 /*return*/, next()];
        }
        return [2 /*return*/, res.status(401).json({
                message: 'レガシー認証は廃止されました。JWT認証システムに移行してください。',
                code: 'LEGACY_AUTH_DEPRECATED'
            })];
    });
}); };
exports.authenticate = authenticate;
/**
 * 管理者権限を検証するミドルウェア
 */
var requireAdmin = function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: '認証されていません' });
    }
    if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({ message: '管理者権限が必要です' });
    }
    next();
};
exports.requireAdmin = requireAdmin;
/**
 * スーパー管理者権限を検証するミドルウェア
 */
var requireSuperAdmin = function (req, res, next) {
    if (!req.user) {
        return res.status(401).json({ message: '認証されていません' });
    }
    if (req.user.role !== UserRole.SUPER_ADMIN) {
        return res.status(403).json({ message: 'スーパー管理者権限が必要です' });
    }
    next();
};
exports.requireSuperAdmin = requireSuperAdmin;
