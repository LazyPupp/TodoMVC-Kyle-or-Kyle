DROP TABLE items;

CREATE TABLE items ( 
   id     serial  NOT NULL,
   title  text    NOT NULL,
   completed BOOLEAN default false,
   CONSTRAINT items_pkey PRIMARY KEY ( id )
);