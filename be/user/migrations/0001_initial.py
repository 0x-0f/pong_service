# Generated by Django 5.1.4 on 2025-01-07 11:11

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Users',
            fields=[
                ('user_id', models.AutoField(primary_key=True, serialize=False)),
                ('intra_id', models.CharField(max_length=255, unique=True)),
                ('refresh_token', models.CharField(default='', max_length=255)),
                ('register_date', models.DateTimeField(default=django.utils.timezone.now)),
                ('last_login', models.DateTimeField(blank=True, null=True)),
                ('pong_win', models.PositiveIntegerField(default=0)),
                ('pong_lose', models.PositiveIntegerField(default=0)),
                ('tournament_win', models.PositiveIntegerField(default=0)),
                ('rsp_win', models.PositiveIntegerField(default=0)),
                ('rsp_lose', models.PositiveIntegerField(default=0)),
            ],
        ),
    ]
