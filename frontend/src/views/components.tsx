import { Link } from "@reach/router";

export const Heading = (props: any) => (
    <h1 class="repo-header" {...props}>
        {props.children}
    </h1>
);

function OrganizationName({ organization }: any) {
    return (
        <span style={{ color: "rgb(37, 99, 235)", fontWeight: 400 }}>
            {organization.name}
        </span>
    );
}

function RepoName({ repo }: any) {
    return (
        <span>
            <OrganizationName organization={repo.org} />{" "}
            <span style={{ color: "rgb(156, 163, 175)" }}>/</span>{" "}
            <span style={{ color: "rgb(37, 99, 235)", fontWeight: 600 }}>
                {repo.name}
            </span>
        </span>
    );
}

function IssueName({ org, repo, issue }: any) {
    return (
        <span>
            <span style={{ color: "rgb(37, 99, 235)", fontWeight: 400 }}>
                {org.name}
            </span>
            <span style={{ color: "rgb(156, 163, 175)" }}> / </span>
            <span style={{ color: "rgb(37, 99, 235)", fontWeight: 400 }}>
                {repo.name}
            </span>
            <span style={{ color: "rgb(156, 163, 175)" }}> / </span>
            <span style={{ color: "rgb(37, 99, 235)", fontWeight: 600 }}>
                #{issue.id} {issue.title}
            </span>
        </span>
    );
}

export function Repository({ repo, canDelete }: any) {
    return (
        <div className="repo">
            <Link to={`/orgs/${repo.orgId}/repos/${repo.id}`}>
                <span>
                    <RepoName repo={repo} />
                    {repo.isPublic && <span className="public">Public</span>}
                </span>
            </Link>
            <Button small className="delete" disabled={!canDelete}>
                Delete
            </Button>
        </div>
    );
}

export function Issue({ repo, issue }: any) {
    return (
        <div className="repo">
            <Link to={`/orgs/${repo.orgId}/repos/${repo.id}/issues/${issue.id}`}>
                <span>
                    <IssueName issue={issue} repo={repo} org={repo.org} />
                </span>
            </Link>
        </div>
    );
}

export function Select(props: any) {
    return (
        <select
            style={{
                color: "black",
                border: "1px solid",
                // borderColor: goodPurples.background,
                padding: 2,
                borderRadius: "4px",
                background: "white",
            }}
            {...props}
        />
    );
}

function Button({ small, ...props }: any) {
    return (
        <button
            style={{
                padding: small ? "0.2rem 0.6rem" : "0.25rem 0.75rem",
                borderRadius: 4,
                border: "0 none",
                fontSize: small ? "14px" : "16px",
                cursor: "pointer",
                lineHeight: small ? "1.35" : "1.15",
                color: "white",
            }}
            {...props}
        />
    );
}
