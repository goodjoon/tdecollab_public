// TDE Collab 기본 에러 클래스
export class TdeCollabError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

// API 요청 실패 에러
export class ApiError extends TdeCollabError {
    constructor(
        public statusCode: number,
        message: string,
        public data?: any
    ) {
        super(`API 요청 실패 (${statusCode}): ${message}`);
    }
}

// 인증 실패 에러
export class AuthError extends TdeCollabError {
    constructor(message: string = '인증에 실패했습니다') {
        super(message);
    }
}

// 리소스 미발견 에러
export class NotFoundError extends TdeCollabError {
    constructor(resource: string, id: string) {
        super(`${resource} '${id}'를 찾을 수 없습니다`);
    }
}

// 리소스 충돌 에러
export class ConflictError extends TdeCollabError {
    constructor(message: string) {
        super(message);
    }
}
