export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
    private level: LogLevel = 'info';

    constructor() {
        this.level = (process.env.LOG_LEVEL as LogLevel) || 'info';
    }

    // 로그 레벨 설정
    setLevel(level: LogLevel) {
        this.level = level;
    }

    // 로그 메시지 포맷팅 (타임스탬프, 레벨 포함)
    private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
        const timestamp = new Date().toISOString();
        let formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

        if (args.length > 0) {
            formattedMessage += ' ' + args.map(arg => {
                if (arg instanceof Error) {
                    return arg.stack || arg.message;
                }
                return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
            }).join(' ');
        }

        // 민감 정보 마스킹 (토큰, 비밀번호 등)
        formattedMessage = this.maskSensitiveData(formattedMessage);

        return formattedMessage;
    }

    // 민감한 데이터(키, 패스워드 등) 마스킹 처리
    private maskSensitiveData(text: string): string {
        // 1. Authorization 헤더 마스킹 (Basic ***, Bearer ***)
        let masked = text.replace(/(Authorization["']?\s*[:=]\s*["']?)(Basic|Bearer)\s+([^"'\s]+)(["']?)/gi, (match, p1, p2, p3, p4) => {
            const maskedToken = p3.length > 8 ? p3.substring(0, 4) + '...' + p3.substring(p3.length - 4) : '******';
            return `${p1}${p2} ${maskedToken}${p4}`;
        });

        // 2. 키워드 기반 마스킹 (token, password, secret, key 등)
        // 헤더 이름(PRIVATE-TOKEN 등)과 변수명 모두 대응 가능하도록 개선
        masked = masked.replace(/((?:token|password|secret|key|api_token|private_token)["']?\s*[:=]\s*["']?)([^"'\s]+)(["']?)/gi, (match, p1, p2, p3) => {
            const maskedValue = p2.length > 8 ? p2.substring(0, 4) + '...' + p2.substring(p2.length - 4) : '******';
            return `${p1}${maskedValue}${p3}`;
        });

        return masked;
    }

    // Debug 레벨 로그 출력
    debug(message: string, ...args: any[]) {
        if (this.shouldLog('debug')) {
            console.error(this.formatMessage('debug', message, ...args));
        }
    }

    // Info 레벨 로그 출력
    info(message: string, ...args: any[]) {
        if (this.shouldLog('info')) {
            console.error(this.formatMessage('info', message, ...args));
        }
    }

    // Warn 레벨 로그 출력
    warn(message: string, ...args: any[]) {
        if (this.shouldLog('warn')) {
            console.error(this.formatMessage('warn', message, ...args));
        }
    }

    // Error 레벨 로그 출력
    error(message: string, ...args: any[]) {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', message, ...args));
        }
    }

    // 현재 설정된 로그 레벨에 따라 출력 여부 결정
    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(level) >= levels.indexOf(this.level);
    }
}

export const logger = new Logger();
