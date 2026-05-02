# [TACP] C. 상용

**페이지 정보:**
- ID: 431798741
- Space: AICC 플랫폼 (AICCDEV)
- URL: https://confluence.tde.example.com/spaces/AICCDEV/pages/431798741/TACP+C.+%EC%83%81%EC%9A%A9

---

## 📌 REMARKS

💋 Application Server 로의 접근은 직접 하지 않도록 하며, 각 VIP 를 통해 접근한다 (단, 모니터링 및 로그 수집 목적 시스템은 직접 서버 IP 로 접근)

---

## 🍁 서버

**⚠️ 모든 서버의 Application 설치 대상 directory 는 /DATA/ 에 마운트 되어있는 disk 를 활용!**

| Host Name | IP | 용도 | Applications | Spec | Listen Port | VIP | mount | 비고 |
|-----------|-------|------|--------------|------|-------------|-----|-------|------|
| IPV-TACP-MSGCGW01 | 172.27.40.105 | 메시징 & 상담 Ch. Gateway #1 | NginX | | 80,443 | | | Messaging Server 의 API Endpoint |
| IPV-TACP-MSGCGW02 | 172.27.40.106 | 메시징 & 상담 Ch. Gateway #2 | NginX | | 80,443 | | | Messaging Server 의 API Endpoint |
| IPV-TACP-MSGWC01 | 172.27.40.103 | 메시징 & 상담 Web #1 | NginX | | 80,443 | | | Messaging Server 의 WebView 기반 대화창 접근 WEB, 채팅 상담 Server 의 Web Admin 접근 WEB |
| IPV-TACP-MSGWC02 | 172.27.40.104 | 메시징 & 상담 Web #2 | NginX | | 80,443 | | | Messaging Server 의 WebView 기반 대화창 접근 WEB, 채팅 상담 Server 의 Web Admin 접근 WEB |
| IPV-TACP-MSGSVR01 | 172.27.40.110 | 메시징 서버 BE #1 | MSGBE #1 | | 8080 | | | |
| IPV-TACP-MSGSVR02 | 172.27.40.111 | 메시징 서버 BE #2 | MSGBE #2 | | 8080 | | | |
| IPV-TACP-CSBE01 | 172.27.40.119 | 상담 서비스 BE #1 | ITLKBE #1 | | 8080 | | | |
| IPV-TACP-CSBE02 | 172.27.40.120 | 상담 서비스 BE #2 | ITLKBE #2 | | 8080 | | | |
| IPV-TACP-WEB01 | 172.27.40.89 | Front Web Server #1 | NginX | | 80,443 | | | |
| IPV-TACP-WEB02 | 172.27.40.90 | Front Web Server #2 | NginX | | 80,443 | | | |
| IPV-TACP-APFE01 | 172.27.40.85 | AICC Portal FE #1 | APFE | | 80 | | | |
| IPV-TACP-APFE02 | 172.27.40.86 | AICC Portal FE #2 | APFE | | 80 | | | |
| IPV-TACP-APBE01 | 172.27.40.101 | AICC Portal Back #1 | APBE #1 | | 8080,8090 | | | |
| IPV-TACP-APBE02 | 172.27.40.102 | AICC Portal Back #2 | APBE #2 | | 8080 | | | |
| IPV-TACP-BBFE01 | 172.27.40.87 | Bot Builder Front #1 | BBFE #1 | | 80 | | | |
| IPV-TACP-BBFE02 | 172.27.40.88 | Bot Builder Front #2 | BBFE #2 | | 80 | | | |
| IPV-TACP-SGW01 | 172.27.40.91 | Service Gateway #1 | SGW #1 | | 8080 | | | |
| IPV-TACP-SGW02 | 172.27.40.92 | Service Gateway #2 | SGW #2 | | 8080 | | | |
| IPV-TACP-BBBE01 | 172.27.40.93 | Bot Builder BE #1 | BBBE #1 | | 8080 (BBBE), 8090 (NLG) | | | |
| IPV-TACP-BBBE02 | 172.27.40.94 | Bot Builder BE #2 | BBBE #2 | | 8080 (BBBE), 8090 (NLG) | | | |
| IPV-TACP-DM01 | 172.27.40.95 | Bot DM Server #1 | DM #1 | | 8080 (DM Server), 8090 (LLM Bridge) | | | |
| IPV-TACP-DM02 | 172.27.40.96 | Bot DM Server #2 | DM #2 | | 8080 (DM Server), 8090 (LLM Bridge) | | | |
| IPV-TACP-DM03 | 172.27.40.117 | Bot DM Server #3 | DM #3 | | | | | |
| IPV-TACP-DM04 | 172.27.40.118 | Bot DM Server #4 | DM #4 | | | | | |
| IPV-TACP-ELK01 | 172.27.40.185 | ELK #1 | | | 8200, 9200 (Elastic), 5601 (Kibana), 5044 | | | |
| IPV-TACP-ELK02 | 172.27.40.186 | ELK #2 | | | 8200,9200,5601,5044 | | | |
| IPV-TACP-ELK03 (IPV-TACP-APIGW01) | 172.27.40.97 | ELK #3 | | | 8200,9200,5601,5044 | | | |
| IPV-TACP-BEP01 | 172.27.40.98 | Backend Proxy #1 | NginX | | 80,443,8080,8090 | | | |
| IPV-TACP-INTWEB01 | 172.27.40.187 | Internal Web Endpoint #1 | NginX | | 80,443,8080,8090, 8200,9200,5601,5044 | | | |
| IPV-TACP-MGMNT01 | 172.27.40.188 | 모니터링 및 관리 서버 | | | 8080, 8090 | | | |
| IPV-TACP-RMQ01 | 172.27.40.107 | RabbitMQ Cluster #1 | RMQ Cluster #1 | | 5672 | | | RabbitMQ (docker) - cluster mode, version 3.12.2-management, port 5672 |
| IPV-TACP-RMQ02 | 172.27.40.108 | RabbitMQ Cluster #2 | RMQ Cluster #2 | | 5672 | | | 상동 |
| IPV-TACP-RMQ03 | 172.27.40.109 | RabbitMQ Cluster #3 | RMQ Cluster #3 | | 5672 | | | 상동 |
| IPV-TACP-REDIS01 | 172.27.40.121 | Redis Cluster #1 | Redis Cluster #1 | | 6379, 6380 (Redis03 Slave) | | | Redis (docker) - cluster mode, version 6.2 |
| IPV-TACP-REDIS02 | 172.27.40.122 | Redis Cluster #2 | Redis Cluster #2 | | 6379, 6380 (Redis01 Slave) | | | 상동 |
| IPV-TACP-REDIS03 | 172.27.40.123 | Redis Cluster #3 | Redis Cluster #3 | | 6379, 6380 (Redis02 Slave) | | | 상동 |
| IPP-TACP-DB01 | 172.27.41.31 | MySQL DB #1 | | | | | | DB 계정: aicc |
| IPP-TACP-DB02 | 172.27.41.32 | MySQL DB #2 | | | | | | |
| IPP-TACP-DB03 | 172.27.41.33 | MySQL DB #3 | | | | | | |

---

## 🍁 VIP

| ID | VIP | From Port | Target Host | Target IP | Target Port | 설명 | Health Check |
|----|-----|-----------|-------------|-----------|-------------|------|--------------|
| VIP01 (사설) | 172.27.50.20 | 80,443 | IPV-TACP-MSGCGW01, IPV-TACP-MSGCGW02 | 172.27.40.105, 172.27.40.106 | 80,443 | 메시징 플랫폼 API 호출 접근 | http://{rip}:80/L7/healthcheck.html |
| VIP02 (사설) | 172.27.50.22 | 80,443 | IPV-TACP-MSGWC01, IPV-TACP-MSGWC02 | 172.27.40.103, 172.27.40.104 | 80,443 | 메시징 플랫폼 Web Client 접근 | http://{rip}:80/L7/healthcheck.html |
| VIP03 (사설) | 172.27.50.23 | 80,443, 88,1443 | IPV-TACP-WEB01, IPV-TACP-WEB02 | 172.27.40.89, 172.27.40.90 | 80,443, 88,1443 | | |
| VIP04 (사설) | | TBD | IPV-TACP-ELK01, IPV-TACP-ELK02, IPV-TACP-ELK03 | 172.27.40.185, 172.27.40.186, 172.27.40.97 | 8200, 9200, 5601, 5044 | 8200-APM, 9200-Elasticsearch, 5601-Kibana, 5044-Logstash | 09.10 - 아직 신규 서버 등록 완료 안됨 |
| VIP05 (사설) | 172.27.50.24 | 8080 | IPV-TACP-MSGSVR01, IPV-TACP-MSGSVR02 | 172.27.40.110, 172.27.40.111 | 8080 | | |
| VIP06 (사설) | 172.27.50.25 | 8080 | IPV-TACP-CSBE01, IPV-TACP-CSBE02 | 172.27.40.119, 172.27.40.120 | 8080 | | |
| VIP07 (사설) | 172.27.50.26 | 8080 | IPV-TACP-APBE01, IPV-TACP-APBE02 | 172.27.40.101, 172.27.40.102 | 8080 | | |
| VIP08 (사설) | 172.27.50.27 | 8080,8090 | IPV-TACP-DM01, IPV-TACP-DM02 | 172.27.40.95, 172.27.40.96 | 8080,8090 | 8080-DMServer, 8090-LLM Bridge | |
| VIP09 (사설) | 172.27.50.28 | 8080,8090 | IPV-TACP-BBBE01, IPV-TACP-BBBE02 | 172.27.40.93, 172.27.40.94 | 8080,8090 | 8080-BBBE, 8090-NLG | |
| VIP10 (사설) | 172.27.50.21 | 8080 | IPV-TACP-SGW01, IPV-TACP-SGW02 | 172.27.40.91, 172.27.40.92 | 8080 | 8080-SGW | |

---

## 🍁 Proxy 설정

**⚠️ Client || Front || 외부 Server → 내부 Server : WEB01 로 접근**

**⚠️ 내부 Server → 내부 Server : 각 서버 별 Proxy 포트로 접근**

### Client, Frontend, 외부 Backend의 접근 채널

| HOST | Protocol | Proxy IP | Port | Path | DEST SVR HOST | DEST IP | Port | Application | Attributes | ETC |
|------|----------|----------|------|------|---------------|---------|------|-------------|------------|-----|
| IPV-TACP-MSGCGW01 | HTTP | 172.27.40.105 | 80,443 | / | IPV-TACP-MSGSVR01, IPV-TACP-MSGSVR02 | 172.27.40.110, 172.27.40.111 | 8080 | MSGBE#1, MSGBE#2 | | |
| IPV-TACP-MSGCGW02 | HTTP | 172.27.40.106 | 80,443 | / | IPV-TACP-MSGSVR01, IPV-TACP-MSGSVR02 | 172.27.40.110, 172.27.40.111 | 8080 | MSGBE#1, MSGBE#2 | | |
| IPV-TACP-MSGWC01 | HTTP | 172.27.40.103 | 80,443 | / | IPV-TACP-MSGSVR01, IPV-TACP-MSGSVR02 | 172.27.40.110, 172.27.40.111 | 8080 | MSGBE#1, MSGBE#2 | | |
| IPV-TACP-MSGWC02 | HTTP | 172.27.40.104 | 80,443 | / | IPV-TACP-MSGSVR01, IPV-TACP-MSGSVR02 | 172.27.40.110, 172.27.40.111 | 8080 | MSGBE#1, MSGBE#2 | | |
| IPV-TACP-WEB01 | HTTP | 172.27.40.89 | 80,443 | / | IPV-TACP-APFE01, IPV-TACP-APFE02 | 172.27.40.85, 172.27.40.86 | 80 | APFE#1, APFE#2 | | |
| IPV-TACP-WEB02 | HTTP | 172.27.40.90 | 80,443 | / | IPV-TACP-APFE01, IPV-TACP-APFE02 | 172.27.40.85, 172.27.40.86 | 80 | APFE#1, APFE#2 | | |
| IPV-TACP-WEB01 | HTTP | 172.27.40.89 | 80,443 | /botbuilder | IPV-TACP-BBFE01, IPV-TACP-BBFE02 | 172.27.40.87, 172.27.40.88 | 80 | BBFE#1, BBFE#2 | | |
| IPV-TACP-WEB02 | HTTP | 172.27.40.90 | 80,443 | /botbuilder | IPV-TACP-BBFE01, IPV-TACP-BBFE02 | 172.27.40.87, 172.27.40.88 | 80 | BBFE#1, BBFE#2 | | |
| IPV-TACP-INTWEB01 | HTTP | 172.27.40.187 | 80,443, 88,1443 | /sgw, /prometheus, /grafana, /elastic, /kibana | | | | | | 모니터링 tool: grafana (계정: guest/1q2w3e4r!), kibana (별도 계정 없음) |
| IPV-TACP-BEP01 | HTTP | 172.27.40.98 | 80,443 | TBD | | | | | | |

**⚠️ Proxy의 Endpoint가 /OOO/인 경우, upstream 요청은 /OOO/을 제외하고 보냄**
(예: http://172.27.42.31/sgw/abc → upstream → http://172.27.42.31/abc)

---

## 🍁 방화벽

### 대외 Open 필요 구간

- .* → TWorld NLU
- CI/CD 상용서버 → .*
- .* → DB 서버
- → ANY

| SRC | DST Host | DST | Port | 비고 |
|-----|----------|-----|------|------|
| SKT myDesk | VIP01 | 172.27.50.20 | 80, 443 | |
| SKT myDesk | VIP02 | 172.27.50.22 | 80, 443 | |
| SKT myDesk | VIP03 | 172.27.50.23 | 80, 443, 88, 1443 | |
| SKT myDesk | IPV-TACP-INTWEB01 | 172.27.40.187 | 80,443,88,1443 | |
| SKT myDesk | IPV-TACP-ELK01 | 172.27.40.185 | 80,443,9200,5601 | |
| SKT myDesk | IPV-TACP-ELK02 | 172.27.40.186 | 80,443,9200,5601 | |
| SKT myDesk | IPV-TACP-ELK03 | 172.27.40.97 | 80,443,9200,5601 | |

---

## 🍁 Context 정의

- Static Web Resource의 상대경로 접근이 불가한 경우, Application의 Root URL도 Web Server의 Context Path와 동일하게 정의함
- 내부 서버들 간에는 Application 앞단의 VIP로 접근 (웹서버 앞의 VIP로 접근하지 않음)

| VIP | port | Application | Context Path (Web) | Application Root URL (WAS) | 비고 |
|-----|------|-------------|-------------------|---------------------------|------|
| 172.27.50.23 (Web Admin) | 80 → 443 | AICC 포털 | / | / | |
| | | 메시징 서버 Web UI | /msgfe/ | /msgfe/ | Messaging Server가 FE/BE 분리 되어있는지 확인 |
| | | 봇 빌더 Web UI | /botbuilder/ | /botbuilder/ | |
| 172.27.50.22 (Web View Client) | 80 → 443 | 메시징 서버 Web View Client | /msgfe/ | /msgfe/ | Messaging Server가 FE/BE 분리 되어있는지 확인 |
| | | 상담 서버 Web Admin | /italk | /italk | 불가 혹은 별도 접근 필요 시 VIP 분리 |
| | 80 (필요시 443) | SGW | /sgw/ | / | 봇플랫폼 Backend API (SGW) Endpoint |
| | 80 (필요시 443) | 메시징 서버 | /msgbe/ | / | (T서비스에이전트 제공중인) API |
| 172.27.50.20 | 80 (필요시 443) | 메시징 API endpoint | / | / | 메시징 서버 Backend (MSGBE)의 API Endpoint |
