import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { ReferenceLine } from "../components/chart";
import {
	BarListChart,
	type DashboardResource,
	DashboardSection,
	DashboardTile,
	DashboardTileLink,
	DonutChart,
} from "../components/dashboard";
import {
	DescriptionList,
	DescriptionListDetails,
	DescriptionListItem,
	DescriptionListTerm,
} from "../components/description-list";

type Summary = {
	variants: number;
	online: number;
	projections: { label: string; value: number; color: string }[];
	errors: { label: string; value: number; color: string }[];
	rules: { active: number; scheduled: number; disabled: number };
};

const summary: Summary = {
	variants: 41207,
	online: 38954,
	projections: [
		{ label: "Listing", value: 28410, color: "var(--chart-2)" },
		{ label: "Index", value: 41207, color: "var(--chart-3)" },
		{ label: "PDP", value: 41190, color: "var(--chart-4)" },
		{ label: "JSON-LD", value: 40876, color: "var(--chart-5)" },
	],
	errors: [
		{ label: "validation", value: 51, color: "var(--label-color-1)" },
		{ label: "parse", value: 6, color: "var(--label-color-2)" },
	],
	rules: { active: 42, scheduled: 11, disabled: 5 },
};

const ready: DashboardResource<Summary> = { state: "ready", data: summary };

function TileLink({ children }: { children: React.ReactNode }) {
	return (
		// biome-ignore lint/a11y/useAnchorContent: the button supplies the link's content.
		<DashboardTileLink render={<a href="#details" />}>
			{children}
		</DashboardTileLink>
	);
}

function OnlineShareTile({
	resource,
}: {
	resource: DashboardResource<Summary>;
}) {
	return (
		<DashboardTile
			title="Online variants"
			description="Share of all variants the shop serves"
			action={<TileLink>Products</TileLink>}
			resource={resource}
			isEmpty={(data) => data.variants === 0}
			emptyMessage="No variants imported yet."
		>
			{(data) => (
				<DonutChart
					data={[
						{ label: "Online", value: data.online, color: "var(--chart-2)" },
						{
							label: "Not online",
							value: data.variants - data.online,
							color: "var(--chart-1)",
						},
					]}
					value={`${Math.round((data.online / data.variants) * 100)}%`}
					caption={`${data.online.toLocaleString()} online`}
				/>
			)}
		</DashboardTile>
	);
}

function ProjectionsTile({
	resource,
}: {
	resource: DashboardResource<Summary>;
}) {
	return (
		<DashboardTile
			title="Catalogue projections"
			description="Entries per projection, against the variant count"
			action={<TileLink>Products</TileLink>}
			resource={resource}
		>
			{(data) => (
				<BarListChart
					data={data.projections}
					dataKey="value"
					// The top margin holds the reference line's label.
					margin={{ left: 0, right: 40, top: 16 }}
				>
					<ReferenceLine
						x={data.variants}
						stroke="var(--muted-foreground)"
						strokeDasharray="4 4"
						label={{
							value: `${data.variants.toLocaleString()} variants`,
							position: "top",
							className: "fui:fill-muted-foreground fui:text-xs",
						}}
					/>
				</BarListChart>
			)}
		</DashboardTile>
	);
}

function ErrorCategoriesTile({
	resource,
}: {
	resource: DashboardResource<Summary>;
}) {
	return (
		<DashboardTile
			title="Error categories"
			description="Import failures by the stage that rejected them"
			action={<TileLink>All errors</TileLink>}
			resource={resource}
		>
			{(data) => (
				<DonutChart
					data={data.errors}
					value={data.errors.reduce((sum, slice) => sum + slice.value, 0)}
					caption="occurrences"
					labels
				/>
			)}
		</DashboardTile>
	);
}

function PriceRulesTile({
	resource,
}: {
	resource: DashboardResource<Summary>;
}) {
	return (
		<DashboardTile
			title="Shop price rules"
			description="In effect now against scheduled"
			action={<TileLink>Price rules</TileLink>}
			resource={resource}
		>
			{({ rules }) => (
				<div className="fui:flex fui:h-full fui:items-center fui:gap-2">
					<DonutChart
						className="fui:min-w-0 fui:flex-1"
						data={[
							{
								label: "Effective now",
								value: rules.active,
								color: "var(--success)",
							},
							{
								label: "Scheduled",
								value: rules.scheduled,
								color: "var(--chart-2)",
							},
						]}
						value={rules.active + rules.scheduled}
						caption="rules"
					/>
					{/* Disabled rules overlap the two slices, so they are read out
					    beside the donut rather than drawn as a third one. */}
					<DescriptionList
						layout="stacked"
						className="fui:shrink-0 fui:pr-2 fui:text-xs"
					>
						{[
							["Effective now", rules.active],
							["Scheduled", rules.scheduled],
							["Disabled", rules.disabled],
						].map(([label, value]) => (
							<DescriptionListItem key={label}>
								<DescriptionListTerm>{label}</DescriptionListTerm>
								<DescriptionListDetails className="fui:text-base fui:font-medium fui:tabular-nums">
									{value}
								</DescriptionListDetails>
							</DescriptionListItem>
						))}
					</DescriptionList>
				</div>
			)}
		</DashboardTile>
	);
}

/** A tile whose heavier data loads only when asked for. */
function OnRequestTile() {
	const [resource, setResource] = React.useState<DashboardResource<Summary>>({
		state: "idle",
	});

	return (
		<DashboardTile
			title="Category index latency"
			description="Loaded on request"
			action={
				resource.state === "idle" ? (
					<Button
						size="sm"
						variant="outline"
						onClick={() => {
							setResource({ state: "loading" });
							setTimeout(() => setResource(ready), 1200);
						}}
					>
						Load
					</Button>
				) : (
					<TileLink>Categories</TileLink>
				)
			}
			resource={resource}
			idle="Not loaded — this one is heavier than the rest."
		>
			{(data) => <BarListChart data={data.projections} dataKey="value" />}
		</DashboardTile>
	);
}

function DashboardKit() {
	return (
		<div className="fui:flex fui:flex-col fui:gap-8">
			<DashboardSection title="Catalogue">
				<OnlineShareTile resource={ready} />
				<ProjectionsTile resource={ready} />
				<ErrorCategoriesTile resource={ready} />
			</DashboardSection>
			<DashboardSection title="Shop output" columns={2}>
				<PriceRulesTile resource={ready} />
				<OnRequestTile />
			</DashboardSection>
		</div>
	);
}

const meta = {
	title: "Data Display/Dashboard",
	component: DashboardKit,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"A dashboard's building blocks. `DashboardSection` sets a heading over a grid of tiles (`columns` 2 or 3). `DashboardTile` is a card whose body renders a `DashboardResource`: a placeholder while loading, the message on error, `emptyMessage` when `isEmpty` holds, the `idle` text for data loaded on request, and `children(data)` once ready. Its body has a fixed `height`, so a row of tiles stays aligned while data arrives. `DashboardTileLink` is the way to the page behind a tile, taking the app's link through `render`. `DonutChart` shows a part-of-whole with a figure in its hole (`labels` names the slices outside the ring), and `BarListChart` one horizontal bar per category, each in its row's `color`.",
			},
		},
	},
	tags: ["autodocs"],
} satisfies Meta<typeof DashboardKit>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Every state a tile's data can be in. */
export const TileStates: Story = {
	name: "Tile states",
	render: () => (
		<DashboardSection title="States">
			<OnlineShareTile resource={{ state: "loading" }} />
			<OnlineShareTile
				resource={{ state: "error", message: "Failed to load the summary." }}
			/>
			<OnlineShareTile
				resource={{
					state: "ready",
					data: { ...summary, variants: 0, online: 0 },
				}}
			/>
		</DashboardSection>
	),
};

/** A badge beside the link, as a caveat about the tile's figures. */
export const WithBadge: Story = {
	name: "Action with a badge",
	render: () => (
		<div className="fui:max-w-md">
			<DashboardTile
				title="Campaign load ahead"
				description="Campaigns live per day, next 30 days"
				action={
					<div className="fui:flex fui:items-center fui:gap-1">
						<Badge variant="outline">Lower bound</Badge>
						<TileLink>Campaigns</TileLink>
					</div>
				}
				resource={ready}
				height={160}
			>
				{(data) => <BarListChart data={data.projections} dataKey="value" />}
			</DashboardTile>
		</div>
	),
};
