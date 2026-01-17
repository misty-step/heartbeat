import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../Card";

describe("Card", () => {
  describe("variants", () => {
    it("renders default variant", () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("bg-[var(--color-bg-elevated)]");
      expect(card).toHaveClass("border");
    });

    it("renders outlined variant", () => {
      render(
        <Card variant="outlined" data-testid="card">
          Content
        </Card>,
      );
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("bg-transparent");
      expect(card).toHaveClass("border");
    });

    it("renders filled variant", () => {
      render(
        <Card variant="filled" data-testid="card">
          Content
        </Card>,
      );
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("bg-[var(--color-bg-secondary)]");
    });

    it("renders glass variant", () => {
      render(
        <Card variant="glass" data-testid="card">
          Content
        </Card>,
      );
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("glass-panel");
    });

    it("renders ghost variant", () => {
      render(
        <Card variant="ghost" data-testid="card">
          Content
        </Card>,
      );
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("bg-transparent");
    });
  });

  describe("padding", () => {
    it("renders md padding by default", () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("p-4");
    });

    it("renders none padding", () => {
      render(
        <Card padding="none" data-testid="card">
          Content
        </Card>,
      );
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("p-0");
    });

    it("renders sm padding", () => {
      render(
        <Card padding="sm" data-testid="card">
          Content
        </Card>,
      );
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("p-3");
    });

    it("renders lg padding", () => {
      render(
        <Card padding="lg" data-testid="card">
          Content
        </Card>,
      );
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("p-6");
    });

    it("renders xl padding", () => {
      render(
        <Card padding="xl" data-testid="card">
          Content
        </Card>,
      );
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("p-8");
    });
  });

  describe("interactive", () => {
    it("is not interactive by default", () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId("card");
      expect(card).not.toHaveClass("cursor-pointer");
    });

    it("adds interactive styles when interactive is true", () => {
      render(
        <Card interactive data-testid="card">
          Content
        </Card>,
      );
      const card = screen.getByTestId("card");
      expect(card).toHaveClass("cursor-pointer");
      expect(card).toHaveClass("card-hover");
    });
  });

  describe("ref forwarding", () => {
    it("forwards ref to div element", () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});

describe("CardHeader", () => {
  it("renders children", () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText("Header content")).toBeInTheDocument();
  });

  it("applies flex column layout", () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);
    const header = screen.getByTestId("header");
    expect(header).toHaveClass("flex");
    expect(header).toHaveClass("flex-col");
  });
});

describe("CardTitle", () => {
  it("renders as h3 element", () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByRole("heading", { level: 3 });
    expect(title).toHaveTextContent("Title");
  });

  it("applies text styling", () => {
    render(<CardTitle data-testid="title">Title</CardTitle>);
    const title = screen.getByTestId("title");
    expect(title).toHaveClass("text-lg");
    expect(title).toHaveClass("font-medium");
  });
});

describe("CardDescription", () => {
  it("renders as paragraph element", () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText("Description text")).toBeInTheDocument();
    expect(screen.getByText("Description text").tagName).toBe("P");
  });

  it("applies secondary text color", () => {
    render(<CardDescription data-testid="desc">Description</CardDescription>);
    const desc = screen.getByTestId("desc");
    expect(desc).toHaveClass("text-sm");
    expect(desc).toHaveClass("text-[var(--color-text-secondary)]");
  });
});

describe("CardContent", () => {
  it("renders children", () => {
    render(<CardContent>Main content</CardContent>);
    expect(screen.getByText("Main content")).toBeInTheDocument();
  });
});

describe("CardFooter", () => {
  it("renders children", () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });

  it("applies flex layout with gap", () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    const footer = screen.getByTestId("footer");
    expect(footer).toHaveClass("flex");
    expect(footer).toHaveClass("items-center");
    expect(footer).toHaveClass("gap-3");
  });
});
