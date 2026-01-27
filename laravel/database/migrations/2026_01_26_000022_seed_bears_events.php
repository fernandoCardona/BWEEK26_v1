<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('events')) {
            return;
        }
        if (!Schema::hasTable('event_program_items')) {
            return;
        }

        $meetingId = '3f6f3f35-5966-4d8f-9a85-7a9f84551c2c';
        $weekId = 'd8b7447a-67b6-43e0-8f38-cfdc5c1f45e3';

        $this->ensureEvent([
            'id' => $meetingId,
            'parent_event_id' => null,
            'name' => ['es' => 'Bears Sitges Meeting'],
            'description' => [
                'es' => "Es el evento que convoca Bears Sitges, conocido también como Bears Sitges Edición Primavera, ya que siempre coincide con el 1º de mayo, y dependiendo del año en curso, el evento puede durar 3/5 días.\n\nCon el Bears Sitges Meeting, invitamos a los Osos de todo el mundo a inaugurar el verano con nosotros y compartir unos días con actividades como: Días de playa, Rutas Culturales, Día de Aperitivos, BBQ, tarde de relax en sauna, Ruta del Oso (bares recomendados), Fiestas, Shows, Etc.. Todo ello en la Capital Bear por excelencia y en el mejor marco del Mediterráneo con más de 800 Bears de todo el mundo.",
            ],
            'event_date' => '2026-04-30 00:00:00',
            'start_at' => '2026-04-30 00:00:00',
            'end_at' => '2026-05-03 23:58:00',
            'address' => 'Sitges, Barcelona, España',
            'is_active' => true,
        ]);

        $this->ensureEvent([
            'id' => $weekId,
            'parent_event_id' => null,
            'name' => ['es' => 'BEARS SITGES WEEK 2026'],
            'description' => [
                'es' => "Programa oficial de Bears Sitges Week 2026. Actividades, rutas, mercado, fiestas y eventos especiales durante toda la semana en Sitges.",
            ],
            'event_date' => '2026-09-04 00:00:00',
            'start_at' => '2026-09-04 00:00:00',
            'end_at' => '2026-09-14 23:58:00',
            'address' => 'Sitges, Barcelona, España',
            'is_active' => true,
        ]);

        $this->ensureSubevent($meetingId, [
            'id' => 'efbd09a8-2c71-45cc-9c58-893a5d83f0db',
            'name' => ['es' => 'WELCOME BEARS PARTY (Scandal Night Club)'],
            'description' => ['es' => 'WELCOME BEARS PARTY en Scandal Night Club. Compra entradas anticipadas en SCANDALSITGES.COM'],
            'start_at' => '2026-04-30 01:00:00',
            'end_at' => '2026-04-30 06:00:00',
        ]);
        $this->ensureSubevent($meetingId, [
            'id' => 'c5203c2f-5e1d-4c82-95c3-7a8590c7d2ad',
            'name' => ['es' => '2º ANIVERSARIO SEDE OFICIAL (Bear’s Bar) THE PARTY (Scandal)'],
            'description' => ['es' => '2º ANIVERSARIO SEDE OFICIAL (Bear’s Bar) “THE PARTY” en Scandal Night Club. Compra entradas anticipadas en SCANDALSITGES.COM'],
            'start_at' => '2026-05-01 01:00:00',
            'end_at' => '2026-05-01 06:00:00',
        ]);
        $this->ensureSubevent($meetingId, [
            'id' => '9e7b2b43-12b2-4d25-9c70-5b3e93cfd834',
            'name' => ['es' => 'THE WORKER PARTY (Scandal)'],
            'description' => ['es' => 'THE WORKER PARTY en Disco SCANDAL. Compra entradas anticipadas en SCANDALSITGES.COM'],
            'start_at' => '2026-05-02 01:00:00',
            'end_at' => '2026-05-02 06:00:00',
        ]);
        $this->ensureSubevent($meetingId, [
            'id' => 'b8a8c9a0-17f5-4f76-9d95-567f9a2db2bf',
            'name' => ['es' => 'THE BEAR PARTY (Scandal)'],
            'description' => ['es' => '“THE BEAR” PARTY en Scandal Night Club. Compra entradas anticipadas en SCANDALSITGES.COM'],
            'start_at' => '2026-05-03 01:00:00',
            'end_at' => '2026-05-03 06:00:00',
        ]);

        $this->ensureProgramItems($meetingId, [
            ['day' => '2026-04-30', 'start' => null, 'end' => null, 'title' => 'Osos en la Playa', 'description' => 'Recomendamos: Playa Balmins (Chiringuito La Caleta) • Playa de la Fragata (Chiringuito Iguana) • Playa Gay Bassa Rodona (Pique Nique Chillout)'],
            ['day' => '2026-04-30', 'start' => null, 'end' => null, 'title' => 'Descubre Sitges', 'description' => 'Recomendamos visitar museos, patrimonio cultural y arquitectónico de la Vila y exposiciones en sponsors.'],
            ['day' => '2026-04-30', 'start' => '19:00', 'end' => '21:00', 'title' => 'Venta de PACKS y Camiseta Oficial', 'description' => 'En Bears Bar.'],
            ['day' => '2026-04-30', 'start' => null, 'end' => null, 'title' => 'Puesta de Sol', 'description' => 'SUNSET desde el Sky Bar del Hotel MiM. Incluye ticket para copa de cava y aperitivo en el Pack (venta exclusiva en Bears Bar).'],
            ['day' => '2026-04-30', 'start' => '20:00', 'end' => null, 'title' => 'Ruta del OSO', 'description' => 'Ruta del OSO en “Bares Sponsors”. Incluye descuentos en el Pack Bears Sitges.'],
            ['day' => '2026-04-30', 'start' => '21:00', 'end' => null, 'title' => 'Noche de Bienvenida', 'description' => 'BEARS en Bear’s Bar (Sede Oficial de Bears Sitges).'],
            ['day' => '2026-05-01', 'start' => null, 'end' => null, 'title' => 'Osos en la Playa', 'description' => 'Recomendamos: Playa Balmins • Playa de la Fragata • Playa Gay Bassa Rodona'],
            ['day' => '2026-05-01', 'start' => null, 'end' => null, 'title' => 'Descubre Sitges', 'description' => 'Museos y patrimonio cultural y arquitectónico de la Vila.'],
            ['day' => '2026-05-01', 'start' => '19:00', 'end' => '21:00', 'title' => 'Venta de PACKS y Camiseta Oficial', 'description' => 'En Bears Bar.'],
            ['day' => '2026-05-01', 'start' => null, 'end' => null, 'title' => 'Puesta de Sol', 'description' => 'SUNSET desde el Sky Bar del Hotel MiM. Incluye ticket en el Pack.'],
            ['day' => '2026-05-01', 'start' => '20:00', 'end' => null, 'title' => 'Ruta del OSO', 'description' => 'Ruta del OSO en “Bares Sponsors”. Incluye descuentos en el Pack.'],
            ['day' => '2026-05-01', 'start' => '21:00', 'end' => null, 'title' => '2º Aniversario Bear’s Bar', 'description' => 'Celebración del 2º Aniversario Bear’s Bar como Sede Oficial. Pastel y cava.'],
            ['day' => '2026-05-02', 'start' => null, 'end' => null, 'title' => 'Osos en la Playa', 'description' => 'Recomendamos: Cala Balmins • Playa Gay Bassa Rodona • Playa de la Fragata'],
            ['day' => '2026-05-02', 'start' => null, 'end' => null, 'title' => 'Descubre Sitges', 'description' => 'Museos, patrimonio cultural y exposiciones en sponsors.'],
            ['day' => '2026-05-02', 'start' => '19:00', 'end' => '21:00', 'title' => 'Venta de PACKS y Camiseta Oficial', 'description' => 'En Bears Bar (si quedan existencias).'],
            ['day' => '2026-05-02', 'start' => '20:00', 'end' => null, 'title' => 'Ruta del OSO', 'description' => 'Ruta del OSO en “Bares Sponsors”. Incluye descuentos en el Pack.'],
            ['day' => '2026-05-02', 'start' => '20:00', 'end' => null, 'title' => 'Dinner Show', 'description' => 'Dinner Show en Parrots Restaurant (reserva en el restaurante).'],
            ['day' => '2026-05-03', 'start' => '14:00', 'end' => null, 'title' => 'BBQ & Music – POP-Air', 'description' => 'En Restaurant LE PATIO. Tickets a la venta en www.popairparty.com'],
            ['day' => '2026-05-03', 'start' => '20:00', 'end' => null, 'title' => 'Ruta del OSO', 'description' => 'Ruta del OSO en “Bares Sponsors”. Incluye descuentos en el Pack.'],
        ]);

        $this->ensureSubevent($weekId, [
            'id' => '2b1d6f5a-2e2d-4b6e-a61f-38c7f0f6c4e1',
            'name' => ['es' => 'WELCOME BEARS en “BEARS DISCO” by Scandal'],
            'description' => ['es' => 'Afterparty en BEARS DISCO by Scandal.'],
            'start_at' => '2026-09-05 01:00:00',
            'end_at' => '2026-09-05 06:00:00',
        ]);
        $this->ensureSubevent($weekId, [
            'id' => 'c8b6b0b1-3c0e-4b4b-ae4e-7b3d5f0d1a5f',
            'name' => ['es' => 'DISCO POP en “BEARS DISCO” by Scandal'],
            'description' => ['es' => 'DISCO POP en BEARS DISCO by Scandal.'],
            'start_at' => '2026-09-06 01:00:00',
            'end_at' => '2026-09-06 06:00:00',
        ]);
        $this->ensureSubevent($weekId, [
            'id' => '1a1b9f35-7a3c-4b92-9c86-6e2f2b0d8a11',
            'name' => ['es' => 'JUNGLE NIGHT PARTY en “BEARS DISCO” by Scandal'],
            'description' => ['es' => 'JUNGLE NIGHT PARTY en BEARS DISCO by Scandal.'],
            'start_at' => '2026-09-07 01:00:00',
            'end_at' => '2026-09-07 06:00:00',
        ]);
        $this->ensureSubevent($weekId, [
            'id' => 'f41a3b17-5df4-4c5a-9a4f-98c5f1b3f6a8',
            'name' => ['es' => 'Opening Night Village After Party (Scandal)'],
            'description' => ['es' => 'After party en BEARS DISCO by Scandal.'],
            'start_at' => '2026-09-08 01:00:00',
            'end_at' => '2026-09-08 06:00:00',
        ]);
        $this->ensureSubevent($weekId, [
            'id' => 'a0a27d66-71b4-4ce5-90b8-3e3b8f8d11d2',
            'name' => ['es' => 'FIESTA BLANCA en “BEARS DISCO” by Scandal'],
            'description' => ['es' => 'FIESTA BLANCA en BEARS DISCO by Scandal.'],
            'start_at' => '2026-09-09 01:00:00',
            'end_at' => '2026-09-09 06:00:00',
        ]);
        $this->ensureSubevent($weekId, [
            'id' => 'a40c8a5c-73d2-4b2a-8b9f-4e0a7e9e2c16',
            'name' => ['es' => '“Beef Mince” Party (Scandal)'],
            'description' => ['es' => '“Beef Mince” Party en BEARS DISCO by Scandal.'],
            'start_at' => '2026-09-10 01:00:00',
            'end_at' => '2026-09-10 06:00:00',
        ]);
        $this->ensureSubevent($weekId, [
            'id' => '2bf7c7b8-1e19-4b0d-9c1d-8c7dbbf2c14c',
            'name' => ['es' => 'BEAR TEA-DANCE (Hotel MiM)'],
            'description' => ['es' => 'BEAR TEA-DANCE en el RoofTop del Hotel MiM. Plazas limitadas.'],
            'start_at' => '2026-09-11 16:00:00',
            'end_at' => '2026-09-11 20:30:00',
        ]);
        $this->ensureSubevent($weekId, [
            'id' => 'f7b7e7d0-2c7f-4a2c-9c3c-8d7f7a2c1b9e',
            'name' => ['es' => 'SAILOR Party en “BEARS DISCO” by Scandal'],
            'description' => ['es' => 'SAILOR Party en BEARS DISCO by Scandal.'],
            'start_at' => '2026-09-11 01:00:00',
            'end_at' => '2026-09-11 06:00:00',
        ]);
        $this->ensureSubevent($weekId, [
            'id' => 'c5a2b4c0-4d8d-4c3b-9f2e-1a0d5f2c3b9f',
            'name' => ['es' => 'BEAR POOL PARTY'],
            'description' => ['es' => 'BEAR POOL PARTY. Transporte en autobús.'],
            'start_at' => '2026-09-12 12:00:00',
            'end_at' => '2026-09-12 18:00:00',
        ]);
        $this->ensureSubevent($weekId, [
            'id' => 'f1c7a2b1-9f3c-4b2a-8d1e-3c2b1a0d9f7c',
            'name' => ['es' => '24º anniBEARsary Bears Sitges Party (Scandal)'],
            'description' => ['es' => '24º anniBEARsary Bears Sitges Party en BEARS DISCO by Scandal.'],
            'start_at' => '2026-09-12 01:00:00',
            'end_at' => '2026-09-12 06:00:00',
        ]);
        $this->ensureSubevent($weekId, [
            'id' => '0f9c2b1a-3c7d-4b2a-9f7c-1a2b3c4d5e6f',
            'name' => ['es' => 'Mr. Bears Sitges “THE PARTY” (Scandal)'],
            'description' => ['es' => 'Mr. Bears Sitges “THE PARTY” en BEARS DISCO by Scandal.'],
            'start_at' => '2026-09-13 01:00:00',
            'end_at' => '2026-09-13 06:00:00',
        ]);
        $this->ensureSubevent($weekId, [
            'id' => 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
            'name' => ['es' => 'FAREWELL PINK PARTY (Scandal)'],
            'description' => ['es' => 'FAREWELL PINK PARTY en BEARS DISCO by Scandal.'],
            'start_at' => '2026-09-14 01:00:00',
            'end_at' => '2026-09-14 06:00:00',
        ]);

        $this->ensureProgramItems($weekId, [
            ['day' => '2026-09-05', 'start' => '20:00', 'end' => null, 'title' => 'Inauguración Bears Sitges Week', 'description' => 'Brindaremos con cava y aperitivo. Hotel Calipolis. Entrada libre.'],
            ['day' => '2026-09-05', 'start' => '22:00', 'end' => null, 'title' => 'Ruta del OSO en “Bares Sponsors”', 'description' => 'Bears Bar • Bears Dance Bar • Moulin Rose Sitges • Runway Terrace • Industry Sitges • Chiringuito Iguana • Parrots Terrace Pub.'],
            ['day' => '2026-09-06', 'start' => null, 'end' => null, 'title' => 'Osos en la Playa', 'description' => 'Recomendamos: Playa Gay Bassa Rodona (Pique Nique Chillout) • Playa Balmins (Chiringuito La Caleta) • Playa de la Fragata (Chiringuito Iguana)'],
            ['day' => '2026-09-06', 'start' => null, 'end' => null, 'title' => 'Descubre Sitges', 'description' => 'Visita museos y patrimonio cultural y arquitectónico de la Vila.'],
            ['day' => '2026-09-06', 'start' => '14:00', 'end' => null, 'title' => 'BBQ & Music – POP-Air', 'description' => 'En Restaurant LE PATIO. Tickets a la venta en el enlace oficial.'],
            ['day' => '2026-09-06', 'start' => '19:00', 'end' => null, 'title' => 'Exposición “MALE BEAUTY” (Vernissage)', 'description' => 'Por Blanca de Nicolas. Galería Bnude Art (c/. Sant Pere, 26 – Sitges). Entrada gratuita, brindis incluido.'],
            ['day' => '2026-09-06', 'start' => '22:00', 'end' => null, 'title' => 'Ruta del OSO en “Bares Sponsors”', 'description' => 'Bears Bar • Bears Dance Bar • Moulin Rose Sitges • Runway Terrace • Industry Sitges • Chiringuito Iguana.'],
            ['day' => '2026-09-06', 'start' => '23:00', 'end' => null, 'title' => 'Fiesta “100% BEARS”', 'description' => 'En Bears Bar.'],
            ['day' => '2026-09-07', 'start' => null, 'end' => null, 'title' => 'Osos en la Playa', 'description' => 'Recomendamos: Playa Gay Bassa Rodona • Playa Balmins • Playa de la Fragata'],
            ['day' => '2026-09-07', 'start' => null, 'end' => null, 'title' => 'Descubre Sitges', 'description' => 'Museos y patrimonio cultural y arquitectónico de la Vila.'],
            ['day' => '2026-09-07', 'start' => '16:00', 'end' => null, 'title' => 'Tarde de Osos', 'description' => 'En Sauna Sitges. Descuentos diarios en el Pack Bears Sitges.'],
            ['day' => '2026-09-07', 'start' => '22:00', 'end' => null, 'title' => 'Ruta del OSO en “Bares Sponsors”', 'description' => 'Bears Bar • Bears Dance Bar • Moulin Rose Sitges • Runway Terrace • Industry Sitges • Chiringuito Iguana.'],
            ['day' => '2026-09-08', 'start' => null, 'end' => null, 'title' => 'Osos en la Playa', 'description' => 'Recomendamos: Playa Gay Bassa Rodona • Playa Balmins • Playa de la Fragata'],
            ['day' => '2026-09-08', 'start' => null, 'end' => null, 'title' => 'Descubre Sitges', 'description' => 'Patrimonio cultural y arquitectónico de la Vila.'],
            ['day' => '2026-09-08', 'start' => '16:30', 'end' => '21:00', 'title' => 'Apertura BEARS SITGES MARKET', 'description' => 'Hotel Calipolis.'],
            ['day' => '2026-09-08', 'start' => '18:00', 'end' => '21:00', 'title' => 'Entrega de BEARS SITGES PACKS y venta Camiseta Oficial', 'description' => 'Bears Sitges Market del Hotel Calipolis.'],
            ['day' => '2026-09-08', 'start' => '22:00', 'end' => null, 'title' => 'Ruta del OSO en “Bares Sponsors”', 'description' => 'Bear-Village • Bears Bar • Bears Dance Bar • Moulin Rose Sitges • Runway Terrace • Industry Sitges • Chiringuito Iguana'],
            ['day' => '2026-09-08', 'start' => '21:00', 'end' => null, 'title' => 'Noche Especial Bienvenida', 'description' => 'En Bear-Village con DJ BEAROSOL. Entrada libre. Tickets VIP en el enlace oficial.'],
            ['day' => '2026-09-09', 'start' => '10:00', 'end' => '13:30', 'title' => 'BEARS SITGES MARKET', 'description' => 'Hotel Calipolis.'],
            ['day' => '2026-09-09', 'start' => '11:30', 'end' => null, 'title' => 'Excursión a PLAYA DEL MUERTO', 'description' => 'Organizada por PRAGUE BEARS. Quedada 11:30 en BEAR-MARKET zona Hotel Calipolis.'],
            ['day' => '2026-09-09', 'start' => '16:00', 'end' => null, 'title' => 'Tarde de OSOS', 'description' => 'En Sauna Sitges. Descuentos incluidos en el Pack.'],
            ['day' => '2026-09-09', 'start' => '18:00', 'end' => '21:00', 'title' => 'Entrega de PACKS y venta Camiseta Oficial', 'description' => 'Bears Sitges Market del Hotel Calipolis.'],
            ['day' => '2026-09-09', 'start' => '19:00', 'end' => null, 'title' => 'Meet & Greet', 'description' => 'Brindis conjunto en Hotel Calipolis.'],
            ['day' => '2026-09-09', 'start' => '22:00', 'end' => null, 'title' => 'Ruta del OSO en “Bares Sponsors”', 'description' => 'Bear-Village • Bears Bar • Bears Dance Bar • Moulin Rose Sitges • Runway Terrace • Industry Sitges • Chiringuito Iguana'],
            ['day' => '2026-09-10', 'start' => '10:00', 'end' => '13:30', 'title' => 'BEARS SITGES MARKET', 'description' => 'Hotel Calipolis.'],
            ['day' => '2026-09-10', 'start' => '16:00', 'end' => null, 'title' => 'THE BEAR BOAT', 'description' => 'Más info y tickets: consulta el enlace oficial.'],
            ['day' => '2026-09-10', 'start' => '16:30', 'end' => '21:00', 'title' => 'BEARS SITGES MARKET', 'description' => 'Hotel Calipolis.'],
            ['day' => '2026-09-10', 'start' => '18:00', 'end' => '21:00', 'title' => 'Entrega de PACKS y venta Camiseta Oficial', 'description' => 'Bears Sitges Market del Hotel Calipolis.'],
            ['day' => '2026-09-10', 'start' => '22:00', 'end' => null, 'title' => 'Ruta del OSO en “Bares Sponsors”', 'description' => 'Bear-Village • Bears Bar • Bears Dance Bar • Moulin Rose Sitges • Runway Terrace • Industry Sitges • Chiringuito Iguana'],
            ['day' => '2026-09-11', 'start' => '10:00', 'end' => '13:30', 'title' => 'BEARS SITGES MARKET', 'description' => 'Hotel Calipolis.'],
            ['day' => '2026-09-11', 'start' => null, 'end' => null, 'title' => 'Osos en la Playa', 'description' => 'Recomendamos: Playa Gay Bassa Rodona • Playa Balmins • Playa de la Fragata'],
            ['day' => '2026-09-11', 'start' => '21:00', 'end' => null, 'title' => 'BEARS on CRUISE Special Night', 'description' => 'En Bear-Village con DJ James Munich. Entrada libre.'],
            ['day' => '2026-09-11', 'start' => '22:00', 'end' => null, 'title' => 'Ruta del OSO en “Bares Sponsors”', 'description' => 'Bear-Village • Bears Bar • Bears Dance Bar • Moulin Rose Sitges • Runway Terrace • Industry Sitges • Chiringuito Iguana'],
            ['day' => '2026-09-12', 'start' => '10:00', 'end' => '13:30', 'title' => 'BEARS SITGES MARKET', 'description' => 'Hotel Calipolis.'],
            ['day' => '2026-09-12', 'start' => '16:30', 'end' => '21:00', 'title' => 'BEARS SITGES MARKET', 'description' => 'Hotel Calipolis.'],
            ['day' => '2026-09-12', 'start' => '20:00', 'end' => null, 'title' => 'Cena Oficial 24º Aniversario Bears Sitges', 'description' => 'Hotel Calipolis. Cóctel, cena y performance. Incluida en el Pack Bears Sitges.'],
            ['day' => '2026-09-12', 'start' => '21:30', 'end' => null, 'title' => 'Noche Especial 24º anniBEARsary', 'description' => 'En Bear-Village con DJ Perfecto. Entrada libre. Tickets VIP en el enlace oficial.'],
            ['day' => '2026-09-13', 'start' => '10:00', 'end' => '13:30', 'title' => 'BEARS SITGES MARKET', 'description' => 'Hotel Calipolis.'],
            ['day' => '2026-09-13', 'start' => '14:00', 'end' => null, 'title' => 'BBQ & Music – POP-Air', 'description' => 'Tickets a la venta en el enlace oficial.'],
            ['day' => '2026-09-13', 'start' => '21:00', 'end' => null, 'title' => 'Special Night Mr. BEAR SITGES', 'description' => 'En Bear-Village con DJ Radio Chi.'],
            ['day' => '2026-09-14', 'start' => '10:00', 'end' => '13:30', 'title' => 'BEARS SITGES MARKET (Últimas horas)', 'description' => 'Hotel Calipolis.'],
            ['day' => '2026-09-14', 'start' => '13:00', 'end' => null, 'title' => 'Sitges Drag Brunch', 'description' => 'Pronto actualización fecha y tickets a la venta en www.bearsevents.com'],
            ['day' => '2026-09-14', 'start' => '21:00', 'end' => null, 'title' => 'Noche Especial Despedida (Rosa)', 'description' => 'En Bear-Village. Ven vestido con algo rosa. Entrada libre.'],
        ]);
    }

    private function ensureEvent(array $event): void
    {
        $exists = DB::table('events')->where('id', $event['id'])->exists();
        if ($exists) {
            return;
        }

        DB::table('events')->insert([
            'id' => $event['id'],
            'parent_event_id' => $event['parent_event_id'],
            'name' => json_encode($event['name']),
            'description' => json_encode($event['description']),
            'event_date' => $event['event_date'],
            'start_at' => $event['start_at'],
            'end_at' => $event['end_at'],
            'location' => null,
            'address' => $event['address'],
            'capacity' => null,
            'is_active' => (bool) $event['is_active'],
            'banner_path' => null,
            'logo_path' => null,
            'flyer_path' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function ensureSubevent(string $parentId, array $sub): void
    {
        $exists = DB::table('events')->where('id', $sub['id'])->exists();
        if ($exists) {
            return;
        }

        DB::table('events')->insert([
            'id' => $sub['id'],
            'parent_event_id' => $parentId,
            'name' => json_encode($sub['name']),
            'description' => json_encode($sub['description']),
            'event_date' => $sub['start_at'],
            'start_at' => $sub['start_at'],
            'end_at' => $sub['end_at'],
            'location' => null,
            'address' => 'Sitges, Barcelona, España',
            'capacity' => null,
            'is_active' => true,
            'banner_path' => null,
            'logo_path' => null,
            'flyer_path' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function ensureProgramItems(string $eventId, array $items): void
    {
        $exists = DB::table('event_program_items')->where('event_id', $eventId)->exists();
        if ($exists) {
            return;
        }

        $rows = [];
        foreach ($items as $i => $item) {
            $rows[] = [
                'id' => (string) \Illuminate\Support\Str::uuid(),
                'event_id' => $eventId,
                'day_date' => $item['day'],
                'start_time' => $item['start'] ? $item['start'] . ':00' : null,
                'end_time' => $item['end'] ? $item['end'] . ':00' : null,
                'title' => $item['title'],
                'description' => $item['description'] ?? null,
                'sort_order' => $i,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('event_program_items')->insert($rows);
    }

    public function down(): void
    {
    }
};
