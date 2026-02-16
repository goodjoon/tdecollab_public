// GitLab 사용자
export interface GitlabUser {
    id: number;
    username: string;
    name: string;
    state: string;
    web_url: string;
}

// GitLab 프로젝트
export interface GitlabProject {
    id: number;
    name: string;
    name_with_namespace: string;
    path_with_namespace: string;
    default_branch: string;
    visibility: string;
    web_url: string;
    ssh_url_to_repo: string;
    http_url_to_repo: string;
    created_at: string;
    last_activity_at: string;
    description?: string;
}

// GitLab Merge Request
export interface GitlabMergeRequest {
    id: number;
    iid: number;
    title: string;
    description: string;
    state: string;
    source_branch: string;
    target_branch: string;
    author: GitlabUser;
    assignee?: GitlabUser | null;
    reviewers?: GitlabUser[];
    labels: string[];
    merge_status: string;
    has_conflicts: boolean;
    web_url: string;
    created_at: string;
    updated_at: string;
    merged_at?: string;
    closed_at?: string;
    pipeline?: { id: number; status: string; web_url: string } | null;
    changes?: GitlabMergeRequestChange[];
}

// MR 변경 파일
export interface GitlabMergeRequestChange {
    old_path: string;
    new_path: string;
    diff: string;
    new_file: boolean;
    renamed_file: boolean;
    deleted_file: boolean;
}

// GitLab 파이프라인
export interface GitlabPipeline {
    id: number;
    status: string;
    ref: string;
    sha: string;
    before_sha?: string;
    created_at: string;
    updated_at: string;
    started_at?: string;
    finished_at?: string;
    duration?: number;
    web_url: string;
    source?: string;
}

// GitLab 파이프라인 작업(Job)
export interface GitlabJob {
    id: number;
    name: string;
    stage: string;
    status: string;
    duration?: number;
    web_url: string;
    created_at: string;
    started_at?: string;
    finished_at?: string;
}

// GitLab 브랜치
export interface GitlabBranch {
    name: string;
    commit: {
        id: string;
        short_id: string;
        message: string;
        author_name: string;
        authored_date: string;
    };
    merged: boolean;
    protected: boolean;
    default: boolean;
}

// GitLab 저장소 파일
export interface GitlabRepositoryFile {
    file_name: string;
    file_path: string;
    size: number;
    encoding: string;
    content: string;
    content_sha256: string;
    ref: string;
    blob_id: string;
    last_commit_id: string;
}

// GitLab 디렉토리 트리 항목
export interface GitlabTreeEntry {
    id: string;
    name: string;
    type: 'blob' | 'tree';
    path: string;
    mode: string;
}

// GitLab 노트(코멘트)
export interface GitlabNote {
    id: number;
    body: string;
    author: GitlabUser;
    created_at: string;
    updated_at: string;
    system: boolean;
}
