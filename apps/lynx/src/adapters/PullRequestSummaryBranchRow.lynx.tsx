import { GitBranchIcon } from '../lib/icons.lynx';

export function PullRequestSummaryBranchRow(props: {
  readonly additions: number;
  readonly baseBranch: string;
  readonly deletions: number;
  readonly headBranch: string;
  readonly label: string;
}) {
  return (
    <view className="SharedPrSummaryMetaRow">
      <view className="SharedPrSummaryMetaLabel SharedPrSummaryMetaLabel--icon">
        <GitBranchIcon
          className="SharedPrSummaryMetaLabelIcon"
          size={14}
        />
        <text className="SharedPrSummaryMetaLabelText">{props.label}</text>
      </view>
      <view className="SharedPrSummaryBranchValue">
        <text className="SharedPrSummaryBranchName">{props.headBranch}</text>
        <text className="SharedPrSummaryBranchArrow">›</text>
        <text className="SharedPrSummaryBranchName">{props.baseBranch}</text>
        <view className="SharedPrSummaryDiffStat">
          <text className="SharedPrSummaryDiffStat--addition">
            +{props.additions.toLocaleString('en-US')}
          </text>
          <text className="SharedPrSummaryDiffStat--deletion">
            -{props.deletions.toLocaleString('en-US')}
          </text>
        </view>
      </view>
    </view>
  );
}
