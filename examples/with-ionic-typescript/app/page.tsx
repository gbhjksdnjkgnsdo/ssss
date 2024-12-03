// app/page.tsx
import IonicLayout from "./components/IonicLayout";
import CardComponent from "./components/CardComponent";

const Home = () => {

  const destinations = new Array(8).fill({
    imageSrc: "/cat.jpg",
    title: "Madison, WI",
    subtitle: "Destination",
    content:
      "Keep close to Nature's heart... and break clear away, once in awhile, and climb a mountain or spend a week in the woods. Wash your spirit clean.",
  });
  return (
    <IonicLayout>
      <ion-grid>
        <ion-row>
          {destinations.map((destination, i) => (
            <ion-col key={i} size="3">
              <CardComponent
                imageSrc={destination.imageSrc}
                title={destination.title}
                subtitle={destination.subtitle}
                content={destination.content}
              />
            </ion-col>
          ))}
        </ion-row>
      </ion-grid>
    </IonicLayout>
  );
};

export default Home;
