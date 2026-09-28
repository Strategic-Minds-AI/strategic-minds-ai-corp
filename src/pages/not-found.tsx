import useFramerTransition from "@/hooks/use-transition";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const NotFound = useFramerTransition(
  <>
    <Helmet>
      <title>Page not found</title>
    </Helmet>
    <main className="relative">
      <section className="mt-[4.5rem] bg-muted py-32 dark:bg-slate-900 lg:mt-[161px]">
        <div className="container text-center">
          <img
            src="not_found.png"
            width={340}
            height={340}
            alt="not found"
            className="mb-12 inline-block"
          />
          <h1 className="mb-4">Sorry We {`Can't`} Find That Page!</h1>
          <p className="mb-12">
            The page you are looking for was moved, removed, renamed or never
            existed.
          </p>
          <Button size="lg" asChild>
            <Link to="/">Take me Home</Link>
          </Button>
        </div>
      </section>
    </main>
  </>,
);

export default NotFound;
