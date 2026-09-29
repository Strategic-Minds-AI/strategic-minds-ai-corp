import StarRating from "./star-rating";

type TestimonialProps = {
  testimonial: Testimonial;
};

const Testimonial = ({
  testimonial: { name, company, comment, image_url, rating },
}: TestimonialProps) => {
  return (
    <div className="h-full rounded-md border border-border bg-card px-10 py-12">
      {(image_url || name || company) && (
        <div className="mb-7 flex items-center">
          {image_url && (
            <img
              src={image_url}
              alt={`Testimonial of ${name}`}
              className="mr-5 h-[55px] w-[55px] shrink-0 rounded-full object-cover"
              width={55}
              height={55}
            />
          )}
          {name || company ? (
            <div className="testimonial__info">
              {name && (
                <span className="mb-1 block text-md font-bold text-foreground dark:text-white">
                  {name}
                </span>
              )}
              {company && (
                <span className="block text-[0.875rem] text-slate-400">
                  {company}
                </span>
              )}
            </div>
          ) : null}
        </div>
      )}

      {comment || rating ? (
        <div>
          {comment && <p className="text-md">{comment}</p>}
          {rating && (
            <div className="mt-4">
              <StarRating value={rating} />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Testimonial;